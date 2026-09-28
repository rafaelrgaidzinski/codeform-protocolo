'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { listarPedidos, listarTipos } from '@/lib/api';
import { formatarDataHora } from '@/lib/formatar';
import {
  PRIORIDADE_LABEL,
  STATUS_LABEL,
  TODOS_OS_STATUS,
  type PaginaDePedidos,
  type StatusPedido,
  type TipoPedido,
} from '@/lib/tipos';

const POR_PAGINA = 10;

export default function ListagemDePedidos() {
  // Opções do filtro de tipo
  const [tipos, setTipos] = useState<TipoPedido[]>([]);

  // Filtros aplicados
  const [status, setStatus] = useState<StatusPedido | ''>('');
  const [tipoId, setTipoId] = useState<number | ''>('');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);

  // O que está sendo digitado no campo de busca (só vira filtro ao pesquisar)
  const [textoDigitado, setTextoDigitado] = useState('');

  // Resultado da consulta
  const [resultado, setResultado] = useState<PaginaDePedidos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarTipos()
      .then(setTipos)
      .catch(() => setTipos([]));
  }, []);

  useEffect(() => {
    let ignorar = false;
    setCarregando(true);
    setErro(null);

    listarPedidos({ status, tipoId, busca, pagina, porPagina: POR_PAGINA })
      .then((dados) => {
        if (!ignorar) setResultado(dados);
      })
      .catch((e: Error) => {
        if (!ignorar) setErro(e.message);
      })
      .finally(() => {
        if (!ignorar) setCarregando(false);
      });

    // Se os filtros mudarem antes da resposta chegar, a resposta antiga é descartada.
    return () => {
      ignorar = true;
    };
  }, [status, tipoId, busca, pagina]);

  function pesquisar(evento: React.FormEvent) {
    evento.preventDefault();
    setBusca(textoDigitado);
    setPagina(1);
  }

  function limparFiltros() {
    setStatus('');
    setTipoId('');
    setBusca('');
    setTextoDigitado('');
    setPagina(1);
  }

  const temFiltro = status !== '' || tipoId !== '' || busca !== '';

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
          <p className="text-sm text-slate-500">Acompanhe os pedidos protocolados no cartório.</p>
        </div>
        {resultado && (
          <p className="text-sm text-slate-500">
            {resultado.total} {resultado.total === 1 ? 'pedido' : 'pedidos'}
          </p>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <form onSubmit={pesquisar} className="flex min-w-64 flex-1 gap-2">
          <input
            type="search"
            value={textoDigitado}
            onChange={(e) => setTextoDigitado(e.target.value)}
            placeholder="Buscar por protocolo, solicitante ou descrição"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Buscar
          </button>
        </form>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusPedido | '');
            setPagina(1);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {TODOS_OS_STATUS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        <select
          value={tipoId}
          onChange={(e) => {
            setTipoId(e.target.value ? Number(e.target.value) : '');
            setPagina(1);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos os tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>

        {temFiltro && (
          <button
            onClick={limparFiltros}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Erro */}
      {erro && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{erro}</div>
      )}

      {/* Tabela */}
      {!erro && (
        <div
          className={`overflow-x-auto rounded-lg border border-slate-200 bg-white transition-opacity ${carregando ? 'opacity-50' : ''}`}
        >
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Protocolo</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Solicitante</th>
                <th className="px-4 py-3 font-medium">Prioridade</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resultado?.itens.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/pedidos/${pedido.id}`}
                      className="font-mono font-medium text-slate-900 underline-offset-2 hover:underline"
                    >
                      {pedido.numeroProtocolo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{pedido.tipo.nome}</td>
                  <td className="px-4 py-3">{pedido.solicitanteNome}</td>
                  <td className="px-4 py-3">{PRIORIDADE_LABEL[pedido.prioridade]}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={pedido.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatarDataHora(pedido.criadoEm)}</td>
                </tr>
              ))}

              {resultado && resultado.itens.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Nenhum pedido encontrado{temFiltro ? ' com esses filtros' : ''}.
                  </td>
                </tr>
              )}

              {!resultado && carregando && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Carregando pedidos...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {resultado && resultado.totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => setPagina((p) => p - 1)}
            disabled={pagina <= 1 || carregando}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-slate-500">
            Página {resultado.pagina} de {resultado.totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => p + 1)}
            disabled={pagina >= resultado.totalPaginas || carregando}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}