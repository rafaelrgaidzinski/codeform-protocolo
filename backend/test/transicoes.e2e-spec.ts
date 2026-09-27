import {
    ConflictException,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StatusPedido } from '@prisma/client';
import { PedidosService } from '../src/pedidos/pedidos.service';
import { PrismaService } from '../src/prisma/prisma.service';

const { PROTOCOLADO, EM_ANALISE, EM_EXIGENCIA, CONCLUIDO } = StatusPedido;

describe('Transições de status (integração com banco real)', () => {
    let moduleRef: TestingModule;
    let service: PedidosService;
    let prisma: PrismaService;
    let tipoId: number;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            providers: [PedidosService, PrismaService],
        }).compile();
        await moduleRef.init();

        service = moduleRef.get(PedidosService);
        prisma = moduleRef.get(PrismaService);
        tipoId = (await prisma.tipoPedido.findFirstOrThrow()).id;
    });

    afterAll(async () => {
        await moduleRef.close();
    });

    function criarPedido() {
        return service.criar({
            tipoId,
            solicitanteNome: 'Teste de transições',
            descricao: 'Pedido criado pelo teste de transições',
        });
    }

    it('percorre o fluxo completo, com ida e volta da exigência, registrando cada passo', async () => {
        const pedido = await criarPedido();

        await service.transicionar(pedido.id, { para: EM_ANALISE });
        await service.transicionar(pedido.id, { para: EM_EXIGENCIA, observacao: 'Falta cópia do RG' });
        await service.transicionar(pedido.id, { para: EM_ANALISE, observacao: 'RG entregue' });
        const final = await service.transicionar(pedido.id, { para: CONCLUIDO });

        expect(final.status).toBe(CONCLUIDO);
        expect(final.historico.map((h) => [h.statusOrigem, h.statusDestino])).toEqual([
            [null, PROTOCOLADO],
            [PROTOCOLADO, EM_ANALISE],
            [EM_ANALISE, EM_EXIGENCIA],
            [EM_EXIGENCIA, EM_ANALISE],
            [EM_ANALISE, CONCLUIDO],
        ]);
        expect(final.historico[2].observacao).toBe('Falta cópia do RG');
    });

    it('rejeita EM_EXIGENCIA → CONCLUIDO sem alterar o pedido nem o histórico', async () => {
        const pedido = await criarPedido();
        await service.transicionar(pedido.id, { para: EM_ANALISE });
        await service.transicionar(pedido.id, { para: EM_EXIGENCIA });

        await expect(service.transicionar(pedido.id, { para: CONCLUIDO })).rejects.toThrow(
            UnprocessableEntityException,
        );

        const noBanco = await prisma.pedido.findUniqueOrThrow({
            where: { id: pedido.id },
            include: { historico: true },
        });
        expect(noBanco.status).toBe(EM_EXIGENCIA);
        expect(noBanco.historico).toHaveLength(3);
    });

    it('responde "não encontrado" para um pedido que não existe', async () => {
        await expect(
            service.transicionar('3f2b8c1e-9d4a-4e7b-8a1c-2b3d4e5f6a7b', { para: EM_ANALISE }),
        ).rejects.toThrow(NotFoundException);
    });

    it('duas transições simultâneas no mesmo pedido: só uma é aplicada', async () => {
        const pedido = await criarPedido();

        const resultados = await Promise.allSettled([
            service.transicionar(pedido.id, { para: EM_ANALISE }),
            service.transicionar(pedido.id, { para: EM_ANALISE }),
        ]);

        const sucessos = resultados.filter((r) => r.status === 'fulfilled');
        const falhas = resultados.filter(
            (r): r is PromiseRejectedResult => r.status === 'rejected',
        );

        expect(sucessos).toHaveLength(1);
        expect(falhas).toHaveLength(1);

        const erro = falhas[0].reason;
        expect(
            erro instanceof ConflictException || erro instanceof UnprocessableEntityException,
        ).toBe(true);

        const totalNoHistorico = await prisma.historicoMovimentacao.count({
            where: { pedidoId: pedido.id },
        });
        expect(totalNoHistorico).toBe(2);
    });
});