import { StatusPedido } from '@prisma/client';
import {
    isEstadoFinal,
    podeTransicionar,
    TransicaoInvalidaError,
    transicoesPermitidas,
    validarTransicao,
} from './maquina-estados';

const { PROTOCOLADO, EM_ANALISE, EM_EXIGENCIA, CONCLUIDO, CANCELADO } = StatusPedido;
const TODOS_OS_STATUS = Object.values(StatusPedido);

// Especificação escrita à mão, de forma independente do código:
// se alguém alterar a regra por engano, estes testes quebram.
const TRANSICOES_VALIDAS: [StatusPedido, StatusPedido][] = [
    [PROTOCOLADO, EM_ANALISE],
    [PROTOCOLADO, CANCELADO],
    [EM_ANALISE, EM_EXIGENCIA],
    [EM_ANALISE, CONCLUIDO],
    [EM_ANALISE, CANCELADO],
    [EM_EXIGENCIA, EM_ANALISE],
    [EM_EXIGENCIA, CANCELADO],
];

const TODAS_AS_COMBINACOES = TODOS_OS_STATUS.flatMap((de) =>
    TODOS_OS_STATUS.map((para) => [de, para] as [StatusPedido, StatusPedido]),
);

const TRANSICOES_INVALIDAS = TODAS_AS_COMBINACOES.filter(
    ([de, para]) => !TRANSICOES_VALIDAS.some(([d, p]) => d === de && p === para),
);

describe('Máquina de estados do pedido', () => {
    describe('transições válidas', () => {
        it.each(TRANSICOES_VALIDAS)('permite %s → %s', (de, para) => {
            expect(podeTransicionar(de, para)).toBe(true);
            expect(() => validarTransicao(de, para)).not.toThrow();
        });
    });

    describe('transições inválidas', () => {
        it('cobre todas as 18 combinações inválidas (25 possíveis - 7 válidas)', () => {
            expect(TRANSICOES_INVALIDAS).toHaveLength(18);
        });

        it.each(TRANSICOES_INVALIDAS)('rejeita %s → %s', (de, para) => {
            expect(podeTransicionar(de, para)).toBe(false);
            expect(() => validarTransicao(de, para)).toThrow(TransicaoInvalidaError);
        });
    });

    it('não permite sair de EM_EXIGENCIA direto para CONCLUIDO (exemplo do enunciado)', () => {
        expect(() => validarTransicao(EM_EXIGENCIA, CONCLUIDO)).toThrow(
            'Transição inválida: EM_EXIGENCIA → CONCLUIDO',
        );
    });

    describe('estados finais', () => {
        it.each([CONCLUIDO, CANCELADO])('%s é final e não tem transições', (status) => {
            expect(isEstadoFinal(status)).toBe(true);
            expect(transicoesPermitidas(status)).toEqual([]);
        });

        it.each([PROTOCOLADO, EM_ANALISE, EM_EXIGENCIA])('%s não é final', (status) => {
            expect(isEstadoFinal(status)).toBe(false);
        });
    });
});