export type StatusPedido = 'PROTOCOLADO' | 'EM_ANALISE' | 'EM_EXIGENCIA' | 'CONCLUIDO' | 'CANCELADO';

export type Prioridade = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';

export type TipoPedido = {
    id: number;
    codigo: string;
    nome: string;
    descricao: string | null;
};

export type Movimentacao = {
    id: string;
    statusOrigem: StatusPedido | null;
    statusDestino: StatusPedido;
    observacao: string | null;
    criadoEm: string;
};

/** Como o pedido vem na listagem (sem histórico). */
export type PedidoResumo = {
    id: string;
    numeroProtocolo: string;
    solicitanteNome: string;
    solicitanteDocumento: string | null;
    descricao: string;
    prioridade: Prioridade;
    status: StatusPedido;
    criadoEm: string;
    atualizadoEm: string;
    tipo: TipoPedido;
};

/** Como o pedido vem no detalhe, na criação e na transição. */
export type Pedido = PedidoResumo & {
    historico: Movimentacao[];
    transicoesPermitidas: StatusPedido[];
};

export type PaginaDePedidos = {
    itens: PedidoResumo[];
    total: number;
    pagina: number;
    porPagina: number;
    totalPaginas: number;
};

export const STATUS_LABEL: Record<StatusPedido, string> = {
    PROTOCOLADO: 'Protocolado',
    EM_ANALISE: 'Em análise',
    EM_EXIGENCIA: 'Em exigência',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
};

export const STATUS_ESTILO: Record<StatusPedido, string> = {
    PROTOCOLADO: 'bg-sky-100 text-sky-800 ring-sky-200',
    EM_ANALISE: 'bg-amber-100 text-amber-800 ring-amber-200',
    EM_EXIGENCIA: 'bg-orange-100 text-orange-800 ring-orange-200',
    CONCLUIDO: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    CANCELADO: 'bg-rose-100 text-rose-800 ring-rose-200',
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
    BAIXA: 'Baixa',
    NORMAL: 'Normal',
    ALTA: 'Alta',
    URGENTE: 'Urgente',
};

export const TODOS_OS_STATUS = Object.keys(STATUS_LABEL) as StatusPedido[];

export const TODAS_AS_PRIORIDADES = Object.keys(PRIORIDADE_LABEL) as Prioridade[];