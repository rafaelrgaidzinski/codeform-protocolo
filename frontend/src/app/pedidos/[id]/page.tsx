'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { ApiError, buscarPedido, transicionarPedido } from '@/lib/api';
import { formatarDataHora } from '@/lib/formatar';
import { PRIORIDADE_LABEL, STATUS_LABEL, type Pedido, type StatusPedido } from '@/lib/tipos';

/** Como cada destino aparece como botão de ação. */
const ACOES: Partial<Record<StatusPedido, { rotulo: string; estilo: string }>> = {
    EM_ANALISE: { rotulo: 'Enviar para análise', estilo: 'bg-slate-900 text-white hover:bg-slate-700' },
    EM_EXIGENCIA: { rotulo: 'Registrar exigência', estilo: 'bg-orange-600 text-white hover:bg-orange-500' },
    CONCLUIDO: { rotulo: 'Concluir pedido', estilo: 'bg-emerald-600 text-white hover:bg-emerald-500' },
    CANCELADO: {
        rotulo: 'Cancelar pedido',
        estilo: 'border border-rose-300 bg-white text-rose-700 hover:bg-rose-50',
    },
};

const ACAO_PADRAO_ESTILO = 'bg-slate-900 text-white hover:bg-slate-700';

export default function DetalheDoPedido() {
    const { id } = useParams<{ id: string }>();

    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

    const [observacao, setObservacao] = useState('');
    const [executando, setExecutando] = useState<StatusPedido | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);

    const carregar = useCallback(async () => {
        try {
            setPedido(await buscarPedido(id));
            setErroCarregamento(null);
        } catch (e) {
            if (e instanceof ApiError && e.status === 404) {
                setErroCarregamento('Pedido não encontrado.');
            } else {
                setErroCarregamento(e instanceof Error ? e.message : 'Erro ao carregar o pedido.');
            }
        } finally {
            setCarregando(false);
        }
    }, [id]);

    useEffect(() => {
        void carregar();
    }, [carregar]);

    async function mover(para: StatusPedido) {
        if (
            para === 'CANCELADO' &&
            !window.confirm('Cancelar é definitivo: o pedido não poderá mais ser movimentado. Deseja continuar?')
        ) {
            return;
        }

        setExecutando(para);
        setAviso(null);

        try {
            const atualizado = await transicionarPedido(id, para, observacao);
            setPedido(atualizado);
            setObservacao('');
        } catch (e) {
            if (e instanceof ApiError && (e.status === 409 || e.status === 422)) {
                // A tela estava desatualizada: outra pessoa mexeu no pedido. Recarrega e explica.
                setAviso(
                    e.status === 409
                        ? 'Este pedido foi alterado por outra pessoa ao mesmo tempo. Os dados foram atualizados: confira e tente novamente.'
                        : `${e.message}. Os dados foram atualizados.`,
                );
                await carregar();
            } else {
                setAviso(e instanceof Error ? e.message : 'Erro inesperado ao movimentar o pedido.');
            }
        } finally {
            setExecutando(null);
        }
    }

    if (carregando && !pedido) {
        return <p className="py-12 text-center text-slate-500">Carregando pedido...</p>;
    }

    if (!pedido) {
        return (
            <div className="mx-auto max-w-md space-y-4 py-12 text-center">
                <p className="text-lg font-medium">{erroCarregamento}</p>
                <Link href="/" className="text-sm text-slate-600 underline">
                    Voltar para a lista
                </Link>
            </div>
        );
    }

    const finalizado = pedido.transicoesPermitidas.length === 0;

    return (
        <div className="space-y-6">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
                ← Voltar para a lista
            </Link>

            {/* Cabeçalho */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-slate-500">Protocolo</p>
                    <h1 className="font-mono text-3xl font-semibold tracking-tight">{pedido.numeroProtocolo}</h1>
                </div>
                <div className="text-right">
                    <StatusBadge status={pedido.status} />
                    <p className="mt-2 text-xs text-slate-500">Criado em {formatarDataHora(pedido.criadoEm)}</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Coluna principal: dados + ações */}
                <div className="space-y-6 lg:col-span-2">
                    <section className="rounded-lg border border-slate-200 bg-white p-6">
                        <h2 className="mb-4 font-semibold">Dados do pedido</h2>
                        <dl className="grid gap-4 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="text-slate-500">Tipo</dt>
                                <dd className="font-medium">{pedido.tipo.nome}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Prioridade</dt>
                                <dd className="font-medium">{PRIORIDADE_LABEL[pedido.prioridade]}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Solicitante</dt>
                                <dd className="font-medium">{pedido.solicitanteNome}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">CPF / CNPJ</dt>
                                <dd className="font-medium">{pedido.solicitanteDocumento ?? '—'}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-slate-500">Descrição</dt>
                                <dd className="whitespace-pre-line">{pedido.descricao}</dd>
                            </div>
                        </dl>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-6">
                        <h2 className="mb-4 font-semibold">Movimentar pedido</h2>

                        {aviso && (
                            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                {aviso}
                            </div>
                        )}

                        {finalizado ? (
                            <p className="text-sm text-slate-500">
                                Este pedido está <strong>{STATUS_LABEL[pedido.status].toLowerCase()}</strong> e não pode mais
                                ser movimentado.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="observacao" className="mb-1 block text-sm font-medium text-slate-700">
                                        Observação <span className="font-normal text-slate-400">(opcional, fica no histórico)</span>
                                    </label>
                                    <textarea
                                        id="observacao"
                                        rows={2}
                                        maxLength={500}
                                        value={observacao}
                                        onChange={(e) => setObservacao(e.target.value)}
                                        placeholder="Ex.: Falta cópia do RG"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {pedido.transicoesPermitidas.map((destino) => {
                                        const acao = ACOES[destino];
                                        return (
                                            <button
                                                key={destino}
                                                onClick={() => mover(destino)}
                                                disabled={executando !== null}
                                                className={`rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${acao?.estilo ?? ACAO_PADRAO_ESTILO}`}
                                            >
                                                {executando === destino ? 'Salvando...' : (acao?.rotulo ?? STATUS_LABEL[destino])}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* Coluna lateral: histórico */}
                <section className="rounded-lg border border-slate-200 bg-white p-6">
                    <h2 className="mb-4 font-semibold">Histórico</h2>
                    <ol className="space-y-5 border-l border-slate-200 pl-6">
                        {pedido.historico.map((mov) => (
                            <li key={mov.id} className="relative">
                                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white bg-slate-400" />
                                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                                    {mov.statusOrigem ? (
                                        <>
                                            <StatusBadge status={mov.statusOrigem} />
                                            <span className="text-slate-400">→</span>
                                        </>
                                    ) : (
                                        <span className="text-slate-500">Criado como</span>
                                    )}
                                    <StatusBadge status={mov.statusDestino} />
                                </div>
                                <p className="mt-1 text-xs text-slate-500">{formatarDataHora(mov.criadoEm)}</p>
                                {mov.observacao && (
                                    <p className="mt-1 rounded bg-slate-50 px-2 py-1 text-sm text-slate-700">{mov.observacao}</p>
                                )}
                            </li>
                        ))}
                    </ol>
                </section>
            </div>
        </div>
    );
}