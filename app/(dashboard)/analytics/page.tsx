'use client';

import { useState, useEffect } from 'react';
import { Loader2, BarChart2, AlertTriangle, TrendingUp, Package, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const fmtCur = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const STATUS_LABELS: Record<string, string> = {
  planejado:    'Planejado',
  em_andamento: 'Em andamento',
  concluido:    'Concluído',
  cancelado:    'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  planejado:    '#a1a1aa',
  em_andamento: '#3b82f6',
  concluido:    '#14b8a6',
  cancelado:    '#f87171',
};

interface Analytics {
  top5Margem: { id: string; nome: string; margem: number | null }[];
  emRisco: { id: string; nome: string; desvio: number | null; temAtraso: boolean }[];
  statusDist: Record<string, number>;
  totais: {
    produtos: number;
    custoReal: number;
    custoPlanejado: number;
    mediaMargemAtivos: number | null;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/mvp/analytics');
        if (!res.ok) throw new Error('Erro ao carregar analytics');
        setData(await res.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
    </div>
  );

  if (error || !data) return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error || 'Erro inesperado'}</p>
      </div>
    </div>
  );

  const pieData = Object.entries(data.statusDist).map(([status, count]) => ({
    name: STATUS_LABELS[status] ?? status,
    value: count,
    color: STATUS_COLORS[status] ?? '#a1a1aa',
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Analytics de Portfólio</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Visão consolidada de todos os produtos</p>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Total produtos</span>
          </div>
          <p className="text-2xl font-bold text-zinc-800">{data.totais.produtos}</p>
        </div>

        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Custo real</span>
          </div>
          <p className="text-2xl font-bold text-zinc-800">{fmtCur.format(data.totais.custoReal)}</p>
        </div>

        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Custo planejado</span>
          </div>
          <p className="text-2xl font-bold text-zinc-800">{fmtCur.format(data.totais.custoPlanejado)}</p>
        </div>

        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Margem média</span>
          </div>
          <p className={`text-2xl font-bold ${
            data.totais.mediaMargemAtivos === null ? 'text-zinc-400' :
            data.totais.mediaMargemAtivos >= 30 ? 'text-teal-600' :
            data.totais.mediaMargemAtivos < 0 ? 'text-red-600' : 'text-zinc-800'
          }`}>
            {data.totais.mediaMargemAtivos !== null ? `${data.totais.mediaMargemAtivos}%` : '—'}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Status distribution donut */}
        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <p className="text-sm font-medium text-zinc-700 mb-3">Distribuição por status</p>
          {pieData.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-8">Nenhum produto cadastrado.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={(props: any) => {
                    const pct = (props.percent ?? 0);
                    return pct > 0.06 ? `${Math.round(pct * 100)}%` : '';
                  }}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [String(value), '']} />
                <Legend
                  formatter={(value) => <span className="text-xs text-zinc-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Produtos em risco */}
        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-medium text-zinc-700">Produtos em risco</p>
            {data.emRisco.length > 0 && (
              <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                {data.emRisco.length}
              </span>
            )}
          </div>
          {data.emRisco.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-8">Nenhum produto em risco.</p>
          ) : (
            <div className="space-y-2">
              {data.emRisco.map((p) => (
                <Link
                  key={p.id}
                  href={`/produtos/${p.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors"
                >
                  <span className="text-xs font-medium text-zinc-800 truncate flex-1 min-w-0 pr-2">{p.nome}</span>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {p.temAtraso && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                        Atraso
                      </span>
                    )}
                    {p.desvio !== null && p.desvio > 15 && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                        +{p.desvio}%
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top 5 margem */}
      <div className="bg-white border border-zinc-100 rounded-xl p-4">
        <p className="text-sm font-medium text-zinc-700 mb-3">Top 5 — melhor margem estimada</p>
        {data.top5Margem.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6">Nenhum dado disponível.</p>
        ) : (
          <div className="space-y-2">
            {data.top5Margem.map((p, i) => (
              <Link
                key={p.id}
                href={`/produtos/${p.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-xs font-medium text-zinc-800 truncate">{p.nome}</span>
                <div className="flex-shrink-0 w-32">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-500"
                        style={{ width: `${Math.min(Math.max((p.margem ?? 0), 0), 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold w-12 text-right ${
                      (p.margem ?? 0) >= 30 ? 'text-teal-600' :
                      (p.margem ?? 0) < 0 ? 'text-red-600' : 'text-zinc-700'
                    }`}>
                      {p.margem}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
