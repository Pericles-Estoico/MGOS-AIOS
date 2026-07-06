'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, AlertTriangle } from 'lucide-react';
import { downloadCSV, todayISO } from '@lib/export-csv';

const fmtCur = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtPct = (v: number | null) => v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;

function fmtDate(d: string | null) {
  if (!d) return '—';
  const [y, m, day] = d.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

const STATUS_LABELS: Record<string, string> = {
  planejado: 'Planejado', em_andamento: 'Em andamento',
  concluido: 'Concluído', cancelado: 'Cancelado',
};
const CATEGORIA_LABELS: Record<string, string> = {
  camiseta: 'Camiseta', calca: 'Calça', vestido: 'Vestido',
  conjunto: 'Conjunto', 'moda-infantil': 'Moda Infantil',
  jaqueta: 'Jaqueta', acessorio: 'Acessório',
};

interface Product {
  id: string; nome: string; categoria: string; canal_venda: string;
  status: string; progresso: number;
  custo_planejado_total: number; custo_acumulado_real: number;
  desvio_pct: number | null; margem_estimada: number | null;
  receita_liquida_estimada: number | null;
  preco_venda: number | null; taxa_canal: number | null; quantidade: number;
  data_recebimento_estimada: string | null;
  tem_atraso: boolean; tem_desvio_custo: boolean;
}

const ROWS: { key: keyof Product | string; label: string }[] = [
  { key: 'categoria',                label: 'Categoria' },
  { key: 'canal_venda',              label: 'Canal de venda' },
  { key: 'status',                   label: 'Status' },
  { key: 'progresso',                label: 'Progresso' },
  { key: 'custo_planejado_total',    label: 'Custo planejado' },
  { key: 'custo_acumulado_real',     label: 'Custo real' },
  { key: 'desvio_pct',               label: 'Desvio de custo' },
  { key: 'receita_liquida_estimada', label: 'Receita líq. est.' },
  { key: 'margem_estimada',          label: 'Margem estimada' },
  { key: 'data_recebimento_estimada',label: 'Recebimento est.' },
];

function renderCell(p: Product, key: string): React.ReactNode {
  switch (key) {
    case 'categoria': return CATEGORIA_LABELS[p.categoria] ?? p.categoria;
    case 'canal_venda': return p.canal_venda;
    case 'status': return STATUS_LABELS[p.status] ?? p.status;
    case 'progresso': return `${p.progresso}%`;
    case 'custo_planejado_total': return fmtCur.format(p.custo_planejado_total ?? 0);
    case 'custo_acumulado_real': return fmtCur.format(p.custo_acumulado_real ?? 0);
    case 'desvio_pct': {
      const v = p.desvio_pct;
      if (v == null) return '—';
      const color = v > 15 ? 'text-red-600 font-semibold' : v < 0 ? 'text-green-600 font-semibold' : 'text-zinc-700';
      return <span className={color}>{fmtPct(v)}</span>;
    }
    case 'receita_liquida_estimada':
      return p.receita_liquida_estimada != null ? fmtCur.format(p.receita_liquida_estimada) : '—';
    case 'margem_estimada': {
      const v = p.margem_estimada;
      if (v == null) return '—';
      const color = v < 0 ? 'text-red-600 font-semibold' : v >= 30 ? 'text-green-600 font-semibold' : 'text-zinc-700';
      return <span className={color}>{fmtPct(v)}</span>;
    }
    case 'data_recebimento_estimada': return fmtDate(p.data_recebimento_estimada);
    default: return '—';
  }
}

function CompararContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids') ?? '';
  const ids = idsParam.split(',').filter(Boolean).slice(0, 4);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ids.length < 2) { setLoading(false); return; }
    fetch('/api/mvp/products')
      .then((r) => r.json())
      .then(({ products: all }) => {
        const selected = (all ?? []).filter((p: Product) => ids.includes(p.id));
        setProducts(selected);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam]);

  function handleExport() {
    const rows = ROWS.map((row) => {
      const r: Record<string, unknown> = { metrica: row.label };
      products.forEach((p) => { r[p.nome] = String(renderCell(p, row.key) ?? ''); });
      return r;
    });
    const cols = [
      { key: 'metrica', label: 'Métrica' },
      ...products.map((p) => ({ key: p.nome, label: p.nome })),
    ];
    downloadCSV(`comparativo-${todayISO()}.csv`, rows, cols);
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto pt-8">
      <div className="animate-pulse space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-10 bg-zinc-100 rounded-xl" />)}
      </div>
    </div>
  );

  if (ids.length < 2) return (
    <div className="max-w-5xl mx-auto pt-8 text-center">
      <p className="text-zinc-500">Selecione ao menos 2 produtos na lista para comparar.</p>
      <button onClick={() => router.push('/produtos')} className="mt-4 text-teal-600 hover:underline text-sm">
        Voltar à lista
      </button>
    </div>
  );

  if (error) return (
    <div className="max-w-5xl mx-auto pt-8">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  );

  const truncated = idsParam.split(',').length > 4;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/produtos')}
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Comparativo de Produtos</h1>
            <p className="text-sm text-zinc-500">{products.length} produtos selecionados</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {truncated && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 text-xs text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          Máximo de 4 produtos. Os primeiros 4 selecionados foram exibidos.
        </div>
      )}

      <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3 w-40">Métrica</th>
                {products.map((p) => (
                  <th key={p.id} className="text-left px-4 py-3 min-w-[180px]">
                    <div className="flex items-start gap-1.5">
                      <div>
                        <p className="font-semibold text-zinc-800 text-sm leading-tight">{p.nome}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.tem_atraso && (
                            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Atraso</span>
                          )}
                          {p.tem_desvio_custo && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">Desvio custo</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.key} className={i % 2 === 0 ? 'bg-zinc-50/40' : 'bg-white'}>
                  <td className="px-4 py-2.5 text-xs font-medium text-zinc-500">{row.label}</td>
                  {products.map((p) => (
                    <td key={p.id} className="px-4 py-2.5 text-zinc-700">
                      {renderCell(p, row.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CompararPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto pt-8 space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-10 bg-zinc-100 rounded-xl animate-pulse" />)}
      </div>
    }>
      <CompararContent />
    </Suspense>
  );
}
