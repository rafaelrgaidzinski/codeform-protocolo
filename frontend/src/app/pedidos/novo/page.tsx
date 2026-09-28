'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { criarPedido, listarTipos } from '@/lib/api';
import { PRIORIDADE_LABEL, TODAS_AS_PRIORIDADES, type Prioridade, type TipoPedido } from '@/lib/tipos';

const ESTILO_CAMPO =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500';
const ESTILO_ROTULO = 'mb-1 block text-sm font-medium text-slate-700';

export default function NovoPedido() {
    const router = useRouter();

    const [tipos, setTipos] = useState<TipoPedido[]>([]);

    // Campos do formulário
    const [tipoId, setTipoId] = useState('');
    const [solicitanteNome, setSolicitanteNome] = useState('');
    const [solicitanteDocumento, setSolicitanteDocumento] = useState('');
    const [descricao, setDescricao] = useState('');
    const [prioridade, setPrioridade] = useState<Prioridade>('NORMAL');

    // Situação do envio
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        listarTipos()
            .then(setTipos)
            .catch((e: Error) => setErro(e.message));
    }, []);

    async function enviar(evento: React.FormEvent) {
        evento.preventDefault();
        setEnviando(true);
        setErro(null);

        try {
            // Aceita o documento com pontuação (123.456.789-01) e envia só os dígitos.
            const documento = solicitanteDocumento.replace(/\D/g, '');

            const pedido = await criarPedido({
                tipoId: Number(tipoId),
                solicitanteNome: solicitanteNome.trim(),
                solicitanteDocumento: documento || undefined,
                descricao: descricao.trim(),
                prioridade,
            });

            // Sucesso: vai direto para o detalhe do pedido recém-protocolado.
            router.push(`/pedidos/${pedido.id}`);
        } catch (e) {
            setErro(e instanceof Error ? e.message : 'Erro inesperado ao criar o pedido.');
            setEnviando(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div>
                <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
                    ← Voltar para a lista
                </Link>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight">Novo pedido</h1>
                <p className="text-sm text-slate-500">
                    O número de protocolo é gerado automaticamente ao salvar.
                </p>
            </div>

            <form onSubmit={enviar} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
                <div>
                    <label htmlFor="tipo" className={ESTILO_ROTULO}>
                        Tipo de pedido *
                    </label>
                    <select
                        id="tipo"
                        required
                        value={tipoId}
                        onChange={(e) => setTipoId(e.target.value)}
                        className={ESTILO_CAMPO}
                    >
                        <option value="" disabled>
                            Selecione o tipo
                        </option>
                        {tipos.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.nome}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="nome" className={ESTILO_ROTULO}>
                            Nome do solicitante *
                        </label>
                        <input
                            id="nome"
                            required
                            maxLength={150}
                            value={solicitanteNome}
                            onChange={(e) => setSolicitanteNome(e.target.value)}
                            className={ESTILO_CAMPO}
                        />
                    </div>

                    <div>
                        <label htmlFor="documento" className={ESTILO_ROTULO}>
                            CPF ou CNPJ <span className="font-normal text-slate-400">(opcional)</span>
                        </label>
                        <input
                            id="documento"
                            inputMode="numeric"
                            maxLength={18}
                            placeholder="Somente números ou com pontuação"
                            value={solicitanteDocumento}
                            onChange={(e) => setSolicitanteDocumento(e.target.value)}
                            className={ESTILO_CAMPO}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="descricao" className={ESTILO_ROTULO}>
                        Descrição *
                    </label>
                    <textarea
                        id="descricao"
                        required
                        rows={4}
                        maxLength={2000}
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        className={ESTILO_CAMPO}
                    />
                </div>

                <div>
                    <label htmlFor="prioridade" className={ESTILO_ROTULO}>
                        Prioridade
                    </label>
                    <select
                        id="prioridade"
                        value={prioridade}
                        onChange={(e) => setPrioridade(e.target.value as Prioridade)}
                        className={ESTILO_CAMPO}
                    >
                        {TODAS_AS_PRIORIDADES.map((p) => (
                            <option key={p} value={p}>
                                {PRIORIDADE_LABEL[p]}
                            </option>
                        ))}
                    </select>
                </div>

                {erro && (
                    <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{erro}</div>
                )}

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                    <Link
                        href="/"
                        className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={enviando}
                        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {enviando ? 'Protocolando...' : 'Protocolar pedido'}
                    </button>
                </div>
            </form>
        </div>
    );
}