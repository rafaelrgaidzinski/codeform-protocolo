import { Test, TestingModule } from '@nestjs/testing';
import { StatusPedido } from '@prisma/client';
import { anoAtualBrasil } from '../src/pedidos/dominio/protocolo';
import { PedidosService } from '../src/pedidos/pedidos.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Numeração de protocolo (integração com banco real)', () => {
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

    it('50 pedidos criados ao mesmo tempo recebem números únicos e consecutivos', async () => {
        const QUANTIDADE = 50;

        const pedidos = await Promise.all(
            Array.from({ length: QUANTIDADE }, (_, i) =>
                service.criar({
                    tipoId,
                    solicitanteNome: `Teste de concorrência ${i}`,
                    descricao: 'Pedido criado pelo teste de concorrência',
                }),
            ),
        );

        const sequenciais = pedidos.map((p) => p.sequencial).sort((a, b) => a - b);

        expect(new Set(sequenciais).size).toBe(QUANTIDADE);
        for (let i = 1; i < sequenciais.length; i++) {
            expect(sequenciais[i]).toBe(sequenciais[i - 1] + 1);
        }
    }, 30_000);

    it('a numeração do ano inteiro não tem buracos (1, 2, 3, ... N)', async () => {
        const pedidosDoAno = await prisma.pedido.findMany({
            where: { ano: anoAtualBrasil() },
            select: { sequencial: true },
            orderBy: { sequencial: 'asc' },
        });

        const sequenciais = pedidosDoAno.map((p) => p.sequencial);
        const esperado = Array.from({ length: sequenciais.length }, (_, i) => i + 1);

        expect(sequenciais).toEqual(esperado);
    });

    it('o pedido nasce PROTOCOLADO, com a criação registrada no histórico', async () => {
        const pedido = await service.criar({
            tipoId,
            solicitanteNome: 'Teste de histórico',
            descricao: 'Pedido para verificar o histórico inicial',
        });

        expect(pedido.status).toBe(StatusPedido.PROTOCOLADO);
        expect(pedido.numeroProtocolo).toMatch(/^\d{4}\/\d{6}$/);
        expect(pedido.historico).toHaveLength(1);
        expect(pedido.historico[0].statusOrigem).toBeNull();
        expect(pedido.historico[0].statusDestino).toBe(StatusPedido.PROTOCOLADO);
    });
});