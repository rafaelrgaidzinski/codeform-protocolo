const FORMATO_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
});

/** "2026-09-28T10:15:00.000Z" → "28/09/2026, 07:15" (horário de Brasília) */
export function formatarDataHora(iso: string): string {
    return FORMATO_DATA_HORA.format(new Date(iso));
}