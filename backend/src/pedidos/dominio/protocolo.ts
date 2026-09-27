const FUSO_DO_CARTORIO = 'America/Sao_Paulo';
const MAX_SEQUENCIAL = 999_999;

/**
 * Ano do protocolo segundo o horário de Brasília, não o do servidor.
 * Um pedido criado às 23h30 de 31/12 (Brasília) já é 01/01 em UTC,
 * mas pertence ao ano que está terminando.
 */
export function anoAtualBrasil(data: Date = new Date()): number {
    const ano = new Intl.DateTimeFormat('en-US', {
        timeZone: FUSO_DO_CARTORIO,
        year: 'numeric',
    }).format(data);
    return Number(ano);
}

export function formatarNumeroProtocolo(ano: number, sequencial: number): string {
    if (!Number.isInteger(sequencial) || sequencial < 1 || sequencial > MAX_SEQUENCIAL) {
        throw new RangeError(
            `Sequencial fora do intervalo permitido (1 a ${MAX_SEQUENCIAL}): ${sequencial}`,
        );
    }
    return `${ano}/${String(sequencial).padStart(6, '0')}`;
}