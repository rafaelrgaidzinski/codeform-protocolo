import { StatusPedido } from '@prisma/client';

const { PROTOCOLADO, EM_ANALISE, EM_EXIGENCIA, CONCLUIDO, CANCELADO } = StatusPedido;

/**
 * Transições permitidas a partir de cada status.
 * Estados finais (Concluído e Cancelado) não têm saída.
 */
export const TRANSICOES_PERMITIDAS: Record<StatusPedido, StatusPedido[]> = {
    PROTOCOLADO: [EM_ANALISE, CANCELADO],
    EM_ANALISE: [EM_EXIGENCIA, CONCLUIDO, CANCELADO],
    EM_EXIGENCIA: [EM_ANALISE, CANCELADO],
    CONCLUIDO: [],
    CANCELADO: [],
};

export class TransicaoInvalidaError extends Error {
    constructor(
        public readonly de: StatusPedido,
        public readonly para: StatusPedido,
    ) {
        super(`Transição inválida: ${de} → ${para}`);
        this.name = 'TransicaoInvalidaError';
    }
}

export function transicoesPermitidas(atual: StatusPedido): StatusPedido[] {
    return TRANSICOES_PERMITIDAS[atual];
}

export function podeTransicionar(de: StatusPedido, para: StatusPedido): boolean {
    return TRANSICOES_PERMITIDAS[de].includes(para);
}

export function validarTransicao(de: StatusPedido, para: StatusPedido): void {
    if (!podeTransicionar(de, para)) {
        throw new TransicaoInvalidaError(de, para);
    }
}

export function isEstadoFinal(status: StatusPedido): boolean {
    return TRANSICOES_PERMITIDAS[status].length === 0;
}