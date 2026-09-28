import type { PaginaDePedidos, Pedido, Prioridade, StatusPedido, TipoPedido } from './tipos';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

/** Erro da API com o código HTTP e o corpo da resposta, para a tela decidir o que mostrar. */
export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly corpo: unknown,
        mensagem: string,
    ) {
        super(mensagem);
        this.name = 'ApiError';
    }
}

async function requisitar<T>(caminho: string, opcoes?: RequestInit): Promise<T> {
    let resposta: Response;
    try {
        resposta = await fetch(`${API_URL}${caminho}`, {
            ...opcoes,
            headers: { 'Content-Type': 'application/json', ...opcoes?.headers },
            cache: 'no-store',
        });
    } catch {
        throw new ApiError(0, null, 'Não foi possível conectar à API. Verifique se o backend está rodando.');
    }

    const corpo: unknown = await resposta.json().catch(() => null);

    if (!resposta.ok) {
        throw new ApiError(resposta.status, corpo, extrairMensagem(corpo) ?? `Erro ${resposta.status}`);
    }

    return corpo as T;
}

/** O NestJS devolve a mensagem de erro como texto ou como lista (erros de validação). */
function extrairMensagem(corpo: unknown): string | null {
    if (corpo && typeof corpo === 'object' && 'message' in corpo) {
        const mensagem = (corpo as { message: unknown }).message;
        if (Array.isArray(mensagem)) return mensagem.join(' • ');
        if (typeof mensagem === 'string') return mensagem;
    }
    return null;
}

export type FiltrosListagem = {
    status?: StatusPedido | '';
    tipoId?: number | '';
    busca?: string;
    pagina?: number;
    porPagina?: number;
};

export function listarPedidos(filtros: FiltrosListagem) {
    const params = new URLSearchParams();
    if (filtros.status) params.set('status', filtros.status);
    if (filtros.tipoId) params.set('tipoId', String(filtros.tipoId));
    if (filtros.busca?.trim()) params.set('busca', filtros.busca.trim());
    params.set('pagina', String(filtros.pagina ?? 1));
    params.set('porPagina', String(filtros.porPagina ?? 10));

    return requisitar<PaginaDePedidos>(`/pedidos?${params.toString()}`);
}

export function buscarPedido(id: string) {
    return requisitar<Pedido>(`/pedidos/${id}`);
}

export function listarTipos() {
    return requisitar<TipoPedido[]>('/tipos-pedido');
}

export type DadosNovoPedido = {
    tipoId: number;
    solicitanteNome: string;
    solicitanteDocumento?: string;
    descricao: string;
    prioridade: Prioridade;
};

export function criarPedido(dados: DadosNovoPedido) {
    return requisitar<Pedido>('/pedidos', { method: 'POST', body: JSON.stringify(dados) });
}

export function transicionarPedido(id: string, para: StatusPedido, observacao?: string) {
    return requisitar<Pedido>(`/pedidos/${id}/transicoes`, {
        method: 'POST',
        body: JSON.stringify({ para, observacao: observacao?.trim() || undefined }),
    });
}