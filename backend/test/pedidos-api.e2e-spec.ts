import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';

describe('API de pedidos (e2e via HTTP)', () => {
    let app: INestApplication;
    let tipoId: number;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        configurarApp(app);
        await app.init();

        const tipos = await request(app.getHttpServer()).get('/tipos-pedido').expect(200);
        tipoId = tipos.body[0].id;
    });

    afterAll(async () => {
        await app.close();
    });

    function api() {
        return request(app.getHttpServer());
    }

    async function criarPedido() {
        const resposta = await api()
            .post('/pedidos')
            .send({ tipoId, solicitanteNome: 'Teste HTTP', descricao: 'Pedido criado pelo teste de API' })
            .expect(201);
        return resposta.body;
    }

    describe('POST /pedidos', () => {
        it('cria o pedido e devolve número, histórico e próximos passos', async () => {
            const pedido = await criarPedido();

            expect(pedido.numeroProtocolo).toMatch(/^\d{4}\/\d{6}$/);
            expect(pedido.status).toBe('PROTOCOLADO');
            expect(pedido.prioridade).toBe('NORMAL');
            expect(pedido.historico).toHaveLength(1);
            expect(pedido.transicoesPermitidas).toEqual(['EM_ANALISE', 'CANCELADO']);
        });

        it('recusa com 400 quando faltam campos obrigatórios', async () => {
            const resposta = await api().post('/pedidos').send({ tipoId }).expect(400);

            expect(resposta.body.message).toEqual(
                expect.arrayContaining(['solicitanteNome é obrigatório', 'descricao é obrigatória']),
            );
        });

        it('recusa com 400 quando o cliente tenta definir o status', async () => {
            const resposta = await api()
                .post('/pedidos')
                .send({ tipoId, solicitanteNome: 'Teste', descricao: 'Tentando burlar o fluxo', status: 'CONCLUIDO' })
                .expect(400);

            expect(resposta.body.message).toEqual(
                expect.arrayContaining(['property status should not exist']),
            );
        });

        it('recusa com 422 quando o tipo não existe', async () => {
            await api()
                .post('/pedidos')
                .send({ tipoId: 999999, solicitanteNome: 'Teste', descricao: 'Tipo inexistente' })
                .expect(422);
        });
    });

    describe('POST /pedidos/:id/transicoes', () => {
        it('percorre o fluxo e recusa o atalho proibido com 422, indicando as opções válidas', async () => {
            const pedido = await criarPedido();
            const rota = `/pedidos/${pedido.id}/transicoes`;

            await api().post(rota).send({ para: 'EM_ANALISE' }).expect(200);
            const emExigencia = await api()
                .post(rota)
                .send({ para: 'EM_EXIGENCIA', observacao: 'Falta documento' })
                .expect(200);

            expect(emExigencia.body.transicoesPermitidas).toEqual(['EM_ANALISE', 'CANCELADO']);

            const recusa = await api().post(rota).send({ para: 'CONCLUIDO' }).expect(422);

            expect(recusa.body.statusAtual).toBe('EM_EXIGENCIA');
            expect(recusa.body.transicoesPermitidas).toEqual(['EM_ANALISE', 'CANCELADO']);
        });

        it('recusa com 400 um status que não existe', async () => {
            const pedido = await criarPedido();

            await api().post(`/pedidos/${pedido.id}/transicoes`).send({ para: 'ARQUIVADO' }).expect(400);
        });
    });

    describe('GET /pedidos/:id', () => {
        it('responde 404 para um pedido que não existe', async () => {
            await api().get('/pedidos/3f2b8c1e-9d4a-4e7b-8a1c-2b3d4e5f6a7b').expect(404);
        });

        it('responde 400 para um id com formato inválido', async () => {
            await api().get('/pedidos/nao-e-um-uuid').expect(400);
        });
    });

    describe('GET /pedidos', () => {
        it('devolve o envelope de paginação e encontra pelo número de protocolo', async () => {
            const pedido = await criarPedido();

            const resposta = await api()
                .get('/pedidos')
                .query({ busca: pedido.numeroProtocolo })
                .expect(200);

            expect(resposta.body).toMatchObject({ total: 1, pagina: 1, porPagina: 20, totalPaginas: 1 });
            expect(resposta.body.itens[0].id).toBe(pedido.id);
        });

        it('recusa com 400 um filtro de status inválido', async () => {
            await api().get('/pedidos').query({ status: 'QUALQUER_COISA' }).expect(400);
        });

        it('recusa com 400 um tamanho de página acima do limite', async () => {
            await api().get('/pedidos').query({ porPagina: 500 }).expect(400);
        });
    });

    describe('GET /tipos-pedido', () => {
        it('lista os tipos cadastrados pelo seed', async () => {
            const resposta = await api().get('/tipos-pedido').expect(200);

            expect(resposta.body.length).toBeGreaterThanOrEqual(5);
            expect(resposta.body[0]).toHaveProperty('codigo');
            expect(resposta.body[0]).toHaveProperty('nome');
        });
    });
});