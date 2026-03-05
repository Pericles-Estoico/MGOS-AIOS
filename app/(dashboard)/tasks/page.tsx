'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, Filter, X } from 'lucide-react';

// ─── tipos ───────────────────────────────────────────────────────────────────

type Marketplace = 'shopee' | 'shein' | 'mercadolivre' | 'amazon' | 'tiktokshop' | 'kaway';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'a_fazer' | 'fazendo' | 'enviado_qa' | 'aprovado' | 'concluido';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  marketplace?: Marketplace | null;
  product_id?: string | null;
}

interface TasksResponse {
  data: Task[];
  pagination: { total: number; limit: number; offset: number };
}

// ─── constantes de UI ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  a_fazer:     'bg-gray-100 text-gray-700',
  fazendo:     'bg-cyan-100 text-cyan-700',
  enviado_qa:  'bg-yellow-100 text-yellow-700',
  aprovado:    'bg-emerald-100 text-emerald-700',
  concluido:   'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<string, string> = {
  a_fazer:    'A Fazer',
  fazendo:    'Fazendo',
  enviado_qa: 'Em Revisão QA',
  aprovado:   'Aprovado',
  concluido:  'Concluído',
};

const PRIORITY_COLORS: Record<string, string> = {
  low:    'text-green-600',
  medium: 'text-yellow-600',
  high:   'text-orange-600',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta',
};

const MARKETPLACE_LABELS: Record<Marketplace, string> = {
  shopee:       'Shopee',
  shein:        'SHEIN',
  mercadolivre: 'Mercado Livre',
  amazon:       'Amazon',
  tiktokshop:   'TikTok Shop',
  kaway:        'Kaway',
};

const MARKETPLACE_COLORS: Record<Marketplace, string> = {
  shopee:       'bg-orange-100 text-orange-700 border-orange-200',
  shein:        'bg-pink-100 text-pink-700 border-pink-200',
  mercadolivre: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  amazon:       'bg-amber-100 text-amber-700 border-amber-200',
  tiktokshop:   'bg-gray-800 text-white border-gray-700',
  kaway:        'bg-blue-100 text-blue-700 border-blue-200',
};

const MARKETPLACE_DOT: Record<Marketplace, string> = {
  shopee:       'bg-orange-500',
  shein:        'bg-pink-500',
  mercadolivre: 'bg-yellow-500',
  amazon:       'bg-amber-500',
  tiktokshop:   'bg-gray-600',
  kaway:        'bg-blue-500',
};

const ALL_MARKETPLACES: Marketplace[] = ['shopee', 'shein', 'mercadolivre', 'amazon', 'tiktokshop', 'kaway'];

// ─── componente ──────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [filterMarketplace, setFilterMarketplace] = useState<Marketplace | ''>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        offset: String(page * limit),
        limit: String(limit),
      });
      if (filterMarketplace) params.set('marketplace', filterMarketplace);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`/api/tasks?${params}`);
      if (!res.ok) {
        if (res.status === 401) { setError('Você precisa estar autenticado'); return; }
        throw new Error('Erro ao buscar tarefas');
      }

      const json: TasksResponse = await res.json();
      setTasks(json.data);
      setTotal(json.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [page, filterMarketplace, filterStatus]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Ao mudar filtro, volta para página 0
  function applyMarketplace(mp: Marketplace | '') {
    setFilterMarketplace(mp);
    setPage(0);
  }

  function applyStatus(s: string) {
    setFilterStatus(s);
    setPage(0);
  }

  const hasFilters = filterMarketplace || filterStatus;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tarefas</h1>
          {!loading && (
            <p className="text-sm text-gray-600 mt-1">
              {total} tarefa{total !== 1 ? 's' : ''}
              {hasFilters ? ' (filtradas)' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition ${
              hasFilters
                ? 'bg-teal-50 border-teal-200 text-teal-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasFilters && (
              <span className="bg-teal-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {[filterMarketplace, filterStatus].filter(Boolean).length}
              </span>
            )}
          </button>
          {session?.user?.role && ['admin', 'head'].includes(session.user.role) && (
            <Link
              href="/tasks/new"
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nova Tarefa
            </Link>
          )}
        </div>
      </div>

      {/* Painel de filtros */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Filtrar por</p>
            {hasFilters && (
              <button
                onClick={() => { applyMarketplace(''); applyStatus(''); }}
                className="flex items-center gap-1 text-xs text-red-600 hover:underline"
              >
                <X className="w-3 h-3" /> Limpar filtros
              </button>
            )}
          </div>

          {/* Filtro de marketplace */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Canal / Marketplace</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyMarketplace('')}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  !filterMarketplace
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Todos
              </button>
              {ALL_MARKETPLACES.map((mp) => (
                <button
                  key={mp}
                  onClick={() => applyMarketplace(mp)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition ${
                    filterMarketplace === mp
                      ? MARKETPLACE_COLORS[mp]
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${MARKETPLACE_DOT[mp]}`} />
                  {MARKETPLACE_LABELS[mp]}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro de status */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Status</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyStatus('')}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  !filterStatus
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Todos
              </button>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => applyStatus(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                    filterStatus === key
                      ? STATUS_COLORS[key]
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Aba rápida de marketplace ativa */}
      {filterMarketplace && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border mb-4 text-sm font-medium ${MARKETPLACE_COLORS[filterMarketplace]}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${MARKETPLACE_DOT[filterMarketplace]}`} />
          Mostrando tarefas de: <strong>{MARKETPLACE_LABELS[filterMarketplace]}</strong>
          <button
            onClick={() => applyMarketplace('')}
            className="ml-auto opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <p className="text-gray-500 text-lg">
            {hasFilters ? 'Nenhuma tarefa com este filtro' : 'Nenhuma tarefa encontrada'}
          </p>
          {hasFilters && (
            <button
              onClick={() => { applyMarketplace(''); applyStatus(''); }}
              className="mt-3 text-sm text-teal-600 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="block bg-white rounded-xl shadow hover:shadow-md transition p-4"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 hover:text-teal-600 transition-colors truncate">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{task.description}</p>
                  )}

                  <div className="flex gap-2 mt-2 flex-wrap items-center">
                    {/* Badge de marketplace */}
                    {task.marketplace && (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full border ${MARKETPLACE_COLORS[task.marketplace]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${MARKETPLACE_DOT[task.marketplace]}`} />
                        {MARKETPLACE_LABELS[task.marketplace]}
                      </span>
                    )}

                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[task.status] || task.status}
                    </span>

                    <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority] || 'text-gray-600'}`}>
                      ● {PRIORITY_LABELS[task.priority] || task.priority}
                    </span>

                    {task.due_date && (
                      <span className="px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded-full">
                        {new Date(task.due_date).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Paginação */}
      {!loading && total > limit && (
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page + 1} · {total} total
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={(page + 1) * limit >= total}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
