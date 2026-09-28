import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StatusPedido } from '@prisma/client';
import { PedidosService } from '../src/pedidos/pedidos.service';
import { PrismaService } from '../src/prisma/prisma.service';

const { EM_ANALISE, EM_EXIGENCIA, CONCLUIDO, CANCELADO } = StatusPedido;

describe('Listagem e detalhe de pedidos (integração com banco real)', () => {
    let moduleRef: TestingModule;
    let service: PedidosService;
    let prisma: PrismaService;

    // Texto único desta execução: os testes só enxergam os pedidos que eles mesmos criaram,
    // mesmo que o banco já tenha outros pedidos de antes.
    const marcador = `LISTAGEM-${Date.now()}`;

    let tipoA: number;
    let tipoB: number;
    let pedidos: { id: string; numeroProtocolo: string }[] = [];

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            providers: [PedidosService, PrismaService],
        }).compile();
        await moduleRef.init();

        service = moduleRef.get(PedidosService);
        prisma = moduleRef.get(PrismaService);

        const tipos = await prisma.tipoPedido.findMany({ take: 2, orderBy: { id: 'asc' } });
        tipoA = tipos[0].id;
        tipoB = tipos[1].id;

        // Criados um de cada vez, para a ordem ser previsível.
        const primeiro = await service.criar({ tipoId: tipoA, solicitanteNome: 'Ana Lima', descricao: `Primeiro ${marcador}` });
        const segundo = await service.criar({ tipoId: tipoA, solicitanteNome: 'Bruno Costa', descricao: `Segundo ${marcador}` });
        const terceiro = await service.criar({ tipoId: tipoB, solicitanteNome: 'Carla Souza', descricao: `Terceiro ${marcador}` });

        await service.transicionar(segundo.id, { para: EM_ANALISE });

        pedidos = [primeiro, segundo, terceiro];
    });

    afterAll(async () => {
        await moduleRef.close();
    });

    it('a busca textual ignora maiúsculas e minúsculas', async () => {
        const resultado = await service.listar({ busca: marcador.toLowerCase(), pagina: 1, porPagina: 20 });

        expect(resultado.total).toBe(3);
    });

    it('lista os mais recentes primeiro', async () => {
        const resultado = await service.listar({ busca: marcador, pagina: 1, porPagina: 20 });

        expect(resultado.itens.map((p) => p.id)).toEqual([pedidos[2].id, pedidos[1].id, pedidos[0].id]);
    });

    it('filtra por status', async () => {
        const resultado = await service.listar({ busca: marcador, status: EM_ANALISE, pagina: 1, porPagina: 20 });

        expect(resultado.total).toBe(1);
        expect(resultado.itens[0].id).toBe(pedidos[1].id);
    });

    it('filtra por tipo', async () => {
        const resultado = await service.listar({ busca: marcador, tipoId: tipoB, pagina: 1, porPagina: 20 });

        expect(resultado.total).toBe(1);
        expect(resultado.itens[0].id).toBe(pedidos[2].id);
    });

    it('encontra um pedido pelo número de protocolo', async () => {
        const resultado = await service.listar({ busca: pedidos[0].numeroProtocolo, pagina: 1, porPagina: 20 });

        expect(resultado.total).toBe(1);
        expect(resultado.itens[0].id).toBe(pedidos[0].id);
    });

    it('pagina os resultados e informa o total de páginas', async () => {
        const pagina1 = await service.listar({ busca: marcador, pagina: 1, porPagina: 2 });
        const pagina2 = await service.listar({ busca: marcador, pagina: 2, porPagina: 2 });

        expect(pagina1.itens).toHaveLength(2);
        expect(pagina1.total).toBe(3);
        expect(pagina1.totalPaginas).toBe(2);
        expect(pagina2.itens).toHaveLength(1);
    });

    it('o detalhe traz o histórico e as transições permitidas', async () => {
        const detalhe = await service.buscarPorId(pedidos[1].id);

        expect(detalhe.historico).toHaveLength(2);
        expect(detalhe.transicoesPermitidas).toEqual([EM_EXIGENCIA, CONCLUIDO, CANCELADO]);
    });

    it('o detalhe de um pedido inexistente responde "não encontrado"', async () => {
        await expect(service.buscarPorId('3f2b8c1e-9d4a-4e7b-8a1c-2b3d4e5f6a7b')).rejects.toThrow(
            NotFoundException,
        );
    });
});