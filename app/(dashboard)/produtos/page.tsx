'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Package, BarChart2, TrendingUp, Download, GitCompareArrows, Copy } from 'lucide-react';
import { downloadCSV, todayISO } from '@lib/export-csv';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planejado:    { label: 'Planejado',    color: 'bg-zinc-100 text-zinc-600' },
  em_andamento: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700' },
  concluido:    { label: 'Concluído',    color: 'bg-green-100 text-green-700' },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-100 text-red-600' },
};

const CATEGORIA_LABELS: Record<string, string> = {
  camiseta:        'Camiseta',
  calca:           'Calça',
  vestido:         'Vestido',
  conjunto:        'Conjunto',
  'moda-infantil': 'Moda Infantil',
  jaqueta:         'Jaqueta',
  acessorio:       'Acessório',
};

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Mais recentes' },
  { value: 'data_inicio', label: 'Data de início' },
  { value: 'custo', label: 'Custo acumulado' },
  { value: 'progresso', label: '% Concluído' },
];

const fmtCur = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

interface MvpProduct {
  id: string;
  nome: string;
  categoria: string;
  canal_venda: string;
  quantidade: number;
  status: string;
  data_inicio_plan: string | null;
  progresso: number;
  tem_atraso: boolean;
  tem_desvio_custo: boolean;
  total_etapas: number;
  etapas_concluidas: number;
  custo_acumulado_real: number;
  custo_planejado_total: number;
  desvio_pct: number | null;
  margem_estimada: number | null;
  receita_liquida_estimada: number | null;
  data_recebimento_estimada: string | null;
  created_at: string;
}

function ProdutosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCats, setSelectedCats] = useState<string[]>(() => {
    const cats = searchParams.get('cat');
    return cats ? cats.split(',').filter(Boolean) : [];
  });
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [canalFilter, setCanalFilter] = useState(searchParams.get('canal') ?? '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') ?? 'created_at');

  const [products, setProducts] = useState<MvpProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  async function handleDuplicate(productId: string) {
    setDuplicating(productId);
    try {
      const res = await fetch(`/api/mvp/products/${productId}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const { product } = await res.json();
        await fetchProducts();
        router.push(`/produtos/${product.id}`);
      } else {
        const d = await res.json();
        alert(d.error ?? 'Erro ao duplicar produto');
      }
    } finally {
      setDuplicating(null);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4 ? [...prev, id] : prev
    );
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCats.length > 0) params.set('cat', selectedCats.join(','));
    if (statusFilter) params.set('status', statusFilter);
    if (canalFilter) params.set('canal', canalFilter);
    if (sortBy && sortBy !== 'created_at') params.set('sort', sortBy);
    const qs = params.toString();
    router.replace(`/produtos${qs ? '?' + qs : ''}`, { scroll: false });
  }, [selectedCats, statusFilter, canalFilter, sortBy, router]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/mvp/products');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erro ao carregar produtos');
      }
      const { products: data } = await res.json();
      setProducts(data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const allCanais = useMemo(
    () => Array.from(new Set(products.map((p) => p.canal_venda))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    let list = [...products];

    if (selectedCats.length > 0) {
      list = list.filter((p) => selectedCats.includes(p.categoria));
    }
    if (statusFilter === 'com_atraso') {
      list = list.filter((p) => p.tem_atraso);
    } else if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (canalFilter) {
      list = list.filter((p) => p.canal_venda === canalFilter);
    }

    list.sort((a, b) => {
      if (sortBy === 'data_inicio') return (a.data_inicio_plan ?? '').localeCompare(b.data_inicio_plan ?? '');
      if (sortBy === 'custo') return b.custo_acumulado_real - a.custo_acumulado_real;
      if (sortBy === 'progresso') return b.progresso - a.progresso;
      return b.created_at.localeCompare(a.created_at);
    });

    return list;
  }, [products, selectedCats, statusFilter, canalFilter, sortBy]);

  const hasFilters = selectedCats.length > 0 || !!statusFilter || !!canalFilter;

  function clearFilters() {
    setSelectedCats([]);
    setStatusFilter('');
    setCanalFilter('');
  }

  function handleExportCSV() {
    const STATUS_LABELS: Record<string, string> = {
      planejado: 'Planejado', em_andamento: 'Em andamento',
      concluido: 'Concluído', cancelado: 'Cancelado',
    };
    const rows = filtered.map((p) => ({
      nome: p.nome,
      categoria: CATEGORIA_LABELS[p.categoria] ?? p.categoria,
      canal_venda: p.canal_venda,
      status: STATUS_LABELS[p.status] ?? p.status,
      progresso: p.progresso,
      etapas_concluidas: p.etapas_concluidas,
      total_etapas: p.total_etapas,
      custo_real: p.custo_acumulado_real.toFixed(2),
      desvio: p.tem_desvio_custo ? 'Sim' : 'Não',
      data_inicio: p.data_inicio_plan ?? '',
      recebimento: p.data_recebimento_estimada ?? '',
    }));
    downloadCSV(`produtos-${todayISO()}.csv`, rows, [
      { key: 'nome',              label: 'Nome' },
      { key: 'categoria',         label: 'Categoria' },
      { key: 'canal_venda',       label: 'Canal de Venda' },
      { key: 'status',            label: 'Status' },
      { key: 'progresso',         label: 'Progresso (%)' },
      { key: 'etapas_concluidas', label: 'Etapas Concluídas' },
      { key: 'total_etapas',      label: 'Total Etapas' },
      { key: 'custo_real',        label: 'Custo Real (R$)' },
      { key: 'desvio',            label: 'Desvio Custo > 15%' },
      { key: 'data_inicio',       label: 'Data de Início' },
      { key: 'recebimento',       label: 'Recebimento Estimado' },
    ]);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Produtos</h1>
          <p className="text-sm text-zinc-500">
            {loading
              ? 'Carregando...'
              : `${filtered.length}${filtered.length !== products.length ? ` de ${products.length}` : ''} produto${products.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length >= 2 && (
            <Link
              href={`/produtos/comparar?ids=${selected.join(',')}`}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <GitCompareArrows className="w-4 h-4" />
              Comparar ({selected.length})
            </Link>
          )}
          {filtered.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          )}
          <Link
            href="/produtos/novo"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo produto
          </Link>
        </div>
      </div>

      {/* Filters + Sort */}
      {!loading && !error && products.length > 0 && (
        <div className="bg-white border border-zinc-100 rounded-xl p-4 mb-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-2">Categoria</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CATEGORIA_LABELS).map(([key, label]) => {
                const active = selectedCats.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setSelectedCats((prev) =>
                        active ? prev.filter((c) => c !== key) : [...prev, key]
                      )
                    }
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? 'bg-teal-100 text-teal-700 border border-teal-300'
                        : 'bg-zinc-50 text-zinc-500 border border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">Todos</option>
                <option value="planejado">Planejado</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
                <option value="com_atraso">Com atraso</option>
              </select>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Canal de venda</label>
              <select
                value={canalFilter}
                onChange={(e) => setCanalFilter(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">Todos</option>
                {allCanais.map((canal) => (
                  <option key={canal} value={canal}>{canal}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
          {error.includes('SERVICE_ROLE_KEY') && (
            <p className="text-xs text-red-500 mt-1">
              Adicione <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> no seu{' '}
              <code className="font-mono">.env.local</code>.
            </p>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-100 p-5 animate-pulse">
              <div className="h-4 bg-zinc-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-zinc-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Product list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {selected.length > 0 && (
            <p className="text-xs text-zinc-400 mb-1">
              {selected.length} selecionado{selected.length > 1 ? 's' : ''} para comparar
              {selected.length < 4 && ` (máx 4)`}
              {' · '}
              <button onClick={() => setSelected([])} className="text-teal-600 hover:underline">Limpar</button>
            </p>
          )}
          {filtered.map((p) => {
            const status = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.planejado;
            const isSelected = selected.includes(p.id);
            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl border transition-all p-4 ${isSelected ? 'border-indigo-300 shadow-sm ring-1 ring-indigo-200' : 'border-zinc-100 hover:border-zinc-200 hover:shadow-sm'}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleSelect(p.id)}
                    title={isSelected ? 'Remover da comparação' : selected.length >= 4 ? 'Máximo de 4 produtos' : 'Adicionar à comparação'}
                    className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600'
                        : selected.length >= 4
                        ? 'border-zinc-200 bg-zinc-50 cursor-not-allowed'
                        : 'border-zinc-300 hover:border-indigo-400'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white mx-auto" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    {/* Name + alert badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3
                        className="font-medium text-zinc-800 truncate cursor-pointer hover:text-teal-700 transition-colors"
                        onClick={() => router.push(`/produtos/${p.id}`)}
                      >
                        {p.nome}
                      </h3>
                      {p.tem_atraso && (
                        <span className="flex-shrink-0 text-xs font-medium bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                          Atraso
                        </span>
                      )}
                      {p.tem_desvio_custo && (
                        <span className="flex-shrink-0 text-xs font-medium bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                          Desvio custo
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mb-3">
                      <span>{CATEGORIA_LABELS[p.categoria] ?? p.categoria}</span>
                      <span>·</span>
                      <span>{p.canal_venda}</span>
                      <span>·</span>
                      <span>{p.quantidade} un.</span>
                      {p.data_inicio_plan && (
                        <>
                          <span>·</span>
                          <span>Início: {fmtDate(p.data_inicio_plan)}</span>
                        </>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="flex flex-wrap gap-4 text-xs mb-3">
                      <div>
                        <span className="text-zinc-400">Custo real:</span>{' '}
                        <span className={`font-semibold ${p.tem_desvio_custo ? 'text-orange-600' : 'text-zinc-700'}`}>
                          {fmtCur.format(p.custo_acumulado_real)}
                        </span>
                      </div>
                      {p.data_recebimento_estimada && (
                        <div>
                          <span className="text-zinc-400">Recebimento est.:</span>{' '}
                          <span className="font-semibold text-teal-600">
                            {fmtDate(p.data_recebimento_estimada)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    {p.total_etapas > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                          <span>{p.etapas_concluidas}/{p.total_etapas} etapas</span>
                          <span>{p.progresso}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${p.tem_atraso ? 'bg-red-400' : 'bg-teal-500'}`}
                            style={{ width: `${p.progresso}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Quick access */}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/produtos/${p.id}?tab=gantt`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        Ver Gantt
                      </Link>
                      <Link
                        href={`/produtos/${p.id}?tab=financeiro`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 hover:border-teal-300 transition-colors"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        Ver Financeiro
                      </Link>
                      <button
                        onClick={() => handleDuplicate(p.id)}
                        disabled={duplicating === p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 hover:border-zinc-300 disabled:opacity-50 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {duplicating === p.id ? 'Duplicando...' : 'Duplicar'}
                      </button>
                    </div>
                  </div>

                  <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtered empty state */}
      {!loading && !error && products.length > 0 && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-100 p-12 text-center">
          <p className="font-medium text-zinc-500">Nenhum produto corresponde aos filtros</p>
          <button
            onClick={clearFilters}
            className="mt-3 text-sm text-teal-600 hover:text-teal-700"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && products.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-100 p-16 text-center">
          <Package className="w-10 h-10 text-zinc-200 mx-auto mb-4" />
          <p className="font-medium text-zinc-500">Nenhum produto ainda</p>
          <p className="text-sm text-zinc-400 mt-1 mb-5">
            Cadastre seu primeiro produto e acompanhe todo o ciclo de produção
          </p>
          <Link
            href="/produtos/novo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro produto
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ProdutosPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto space-y-3 pt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-100 p-5 animate-pulse">
              <div className="h-4 bg-zinc-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-zinc-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      }
    >
      <ProdutosContent />
    </Suspense>
  );
}
