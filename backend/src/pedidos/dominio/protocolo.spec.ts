import { anoAtualBrasil, formatarNumeroProtocolo } from './protocolo';

describe('Formatação do número de protocolo', () => {
    it.each([
        [2026, 1, '2026/000001'],
        [2026, 123, '2026/000123'],
        [2027, 999999, '2027/999999'],
    ])('formata ano %i e sequencial %i como %s', (ano, sequencial, esperado) => {
        expect(formatarNumeroProtocolo(ano, sequencial)).toBe(esperado);
    });

    it.each([0, -1, 1_000_000, 1.5])('recusa sequencial inválido: %p', (sequencial) => {
        expect(() => formatarNumeroProtocolo(2026, sequencial)).toThrow(RangeError);
    });
});

describe('Ano do protocolo no fuso de Brasília', () => {
    it('31/12 às 23h30 em Brasília ainda é o ano que está terminando', () => {
        // 23h30 em Brasília = 02h30 do dia seguinte em UTC
        expect(anoAtualBrasil(new Date('2027-01-01T02:30:00Z'))).toBe(2026);
    });

    it('01/01 às 00h30 em Brasília já é o ano novo', () => {
        expect(anoAtualBrasil(new Date('2027-01-01T03:30:00Z'))).toBe(2027);
    });
});