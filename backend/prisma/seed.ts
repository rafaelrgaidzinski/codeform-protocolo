import { Prioridade, StatusPedido } from '@prisma/client';
import { PedidosService } from '../src/pedidos/pedidos.service';
import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaService();
const pedidosService = new PedidosService(prisma);

const { EM_ANALISE, EM_EXIGENCIA, CONCLUIDO, CANCELADO } = StatusPedido;

const tipos = [
    { codigo: 'SEGUNDA_VIA_CERTIDAO', nome: 'Segunda via de certidão', descricao: 'Emissão de segunda via de certidão de nascimento, casamento ou óbito' },
    { codigo: 'LAVRATURA_ESCRITURA', nome: 'Lavratura de escritura', descricao: 'Lavratura de escritura pública (compra e venda, doação, inventário)' },
    { codigo: 'RECONHECIMENTO_FIRMA', nome: 'Reconhecimento de firma', descricao: 'Reconhecimento de firma por semelhança ou autenticidade' },
    { codigo: 'AUTENTICACAO_COPIA', nome: 'Autenticação de cópia', descricao: 'Autenticação de cópia de documento' },
    { codigo: 'PROCURACAO', nome: 'Procuração pública', descricao: 'Lavratura de procuração pública' },
];

type Passo = { para: StatusPedido; observacao?: string };

type Exemplo = {
    codigoTipo: string;
    solicitanteNome: string;
    solicitanteDocumento?: string;
    descricao: string;
    prioridade: Prioridade;
    caminho: Passo[];
};

// Cada exemplo termina num status diferente, para a tela mostrar o fluxo inteiro.
const exemplos: Exemplo[] = [
    {
        codigoTipo: 'SEGUNDA_VIA_CERTIDAO',
        solicitanteNome: 'Maria Souza',
        solicitanteDocumento: '12345678901',
        descricao: 'Segunda via da certidão de nascimento para renovação de passaporte',
        prioridade: Prioridade.NORMAL,
        caminho: [],
    },
    {
        codigoTipo: 'LAVRATURA_ESCRITURA',
        solicitanteNome: 'João Pereira',
        solicitanteDocumento: '98765432100',
        descricao: 'Escritura de compra e venda de apartamento no centro',
        prioridade: Prioridade.ALTA,
        caminho: [{ para: EM_ANALISE }],
    },
    {
        codigoTipo: 'RECONHECIMENTO_FIRMA',
        solicitanteNome: 'Ana Lima',
        descricao: 'Reconhecimento de firma em contrato de locação',
        prioridade: Prioridade.BAIXA,
        caminho: [
            { para: EM_ANALISE },
            { para: EM_EXIGENCIA, observacao: 'Falta documento de identidade com foto' },
        ],
    },
    {
        codigoTipo: 'PROCURACAO',
        solicitanteNome: 'Carlos Mendes',
        solicitanteDocumento: '11222333000181',
        descricao: 'Procuração pública para representação em assembleia de condomínio',
        prioridade: Prioridade.URGENTE,
        caminho: [{ para: EM_ANALISE }, { para: CONCLUIDO }],
    },
    {
        codigoTipo: 'AUTENTICACAO_COPIA',
        solicitanteNome: 'Fernanda Rocha',
        descricao: 'Autenticação de cópia do diploma de graduação',
        prioridade: Prioridade.NORMAL,
        caminho: [{ para: CANCELADO, observacao: 'Desistência do solicitante' }],
    },
    {
        codigoTipo: 'LAVRATURA_ESCRITURA',
        solicitanteNome: 'Roberto Alves',
        descricao: 'Escritura de doação de imóvel rural aos filhos',
        prioridade: Prioridade.NORMAL,
        caminho: [
            { para: EM_ANALISE },
            { para: EM_EXIGENCIA, observacao: 'Falta certidão de ônus reais atualizada' },
            { para: EM_ANALISE, observacao: 'Certidão entregue' },
            { para: CONCLUIDO },
        ],
    },
];

async function semearTipos() {
    for (const tipo of tipos) {
        await prisma.tipoPedido.upsert({
            where: { codigo: tipo.codigo },
            update: { nome: tipo.nome, descricao: tipo.descricao },
            create: tipo,
        });
    }
    console.log(`Tipos de pedido: ${tipos.length} garantidos.`);
}

async function semearPedidosDeExemplo() {
    const existentes = await prisma.pedido.count();
    if (existentes > 0) {
        console.log(`Pedidos de exemplo ignorados: o banco já tem ${existentes} pedido(s).`);
        return;
    }

    for (const exemplo of exemplos) {
        const tipo = await prisma.tipoPedido.findUniqueOrThrow({ where: { codigo: exemplo.codigoTipo } });

        const pedido = await pedidosService.criar({
            tipoId: tipo.id,
            solicitanteNome: exemplo.solicitanteNome,
            solicitanteDocumento: exemplo.solicitanteDocumento,
            descricao: exemplo.descricao,
            prioridade: exemplo.prioridade,
        });

        for (const passo of exemplo.caminho) {
            await pedidosService.transicionar(pedido.id, passo);
        }
    }
    console.log(`Pedidos de exemplo: ${exemplos.length} criados.`);
}

async function main() {
    await semearTipos();
    await semearPedidosDeExemplo();
}

main()
    .catch((erro) => {
        console.error(erro);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());