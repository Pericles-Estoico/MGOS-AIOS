'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { downloadCSV, todayISO } from '@lib/export-csv';

const fmtCur = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmtCurFull = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface MonthData {
  key: string; label: string;
  saidas: number; entradas: number;
  saldo_mes: number; saldo_acumulado: number;
}

interface CashflowData {
  months: MonthData[];
  summary: { total_entradas: number; total_saidas: number; saldo_liquido: number };
  sem_data_recebimento: string[];
}

const PERIOD_OPTIONS = [
  { value: 3,  label: '3 meses' },
  { value: 6,  label: '6 meses' },
  { value: 12, label: '12 meses' },
];

export default function FluxoCaixaPage() {
  const [period, setPeriod] = useState(6);
  const [data, setData] = useState<CashflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/mvp/cashflow?months=${period}`);
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Erro ao carregar fluxo de caixa');
      }
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleExport() {
    if (!data) return;
    downloadCSV(`fluxo-caixa-${todayISO()}.csv`, data.months.map(m => ({
      mes: m.label,
      saidas: m.saidas.toFixed(2),
      entradas: m.entradas.toFixed(2),
      saldo_mes: m.saldo_mes.toFixed(2),
      saldo_acumulado: m.saldo_acumulado.toFixed(2),
    })), [
      { key: 'mes',             label: 'Mês' },
      { key: 'saidas',          label: 'Saídas (R$)' },
      { key: 'entradas',        label: 'Entradas (R$)' },
      { key: 'saldo_mes',       label: 'Saldo do Mês (R$)' },
      { key: 'saldo_acumulado', label: 'Saldo Acumulado (R$)' },
    ]);
  }

  const summaryCards = data ? [
    {
      label: 'Total a receber',
      value: fmtCurFull.format(data.summary.total_entradas),
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      color: 'bg-green-50 border-green-100',
    },
    {
      label: 'Total de custos previstos',
      value: fmtCurFull.format(data.summary.total_saidas),
      icon: <TrendingDown className="w-5 h-5 text-red-500" />,
      color: 'bg-red-50 border-red-100',
    },
    {
      label: 'Saldo líquido estimado',
      value: fmtCurFull.format(data.summary.saldo_liquido),
      icon: <Wallet className={`w-5 h-5 ${data.summary.saldo_liquido >= 0 ? 'text-teal-600' : 'text-orange-500'}`} />,
      color: data.summary.saldo_liquido >= 0 ? 'bg-teal-50 border-teal-100' : 'bg-orange-50 border-orange-100',
    },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Fluxo de Caixa</h1>
          <p className="text-sm text-zinc-500">Previsão consolidada de entradas e saídas</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === opt.value
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {data && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          )}
        </div>
      </div>

      {/* Alert for products without estimated date */}
      {data?.sem_data_recebimento && data.sem_data_recebimento.length > 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 text-xs text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            <strong>{data.sem_data_recebimento.length} produto{data.sem_data_recebimento.length > 1 ? 's' : ''}</strong> sem
            data de venda estimada foram excluídos das entradas:{' '}
            {data.sem_data_recebimento.join(', ')}.
          </span>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-zinc-100 rounded-xl animate-pulse" />)}
          </div>
          <div className="h-64 bg-zinc-100 rounded-xl animate-pulse" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {summaryCards.map((card) => (
              <div key={card.label} className={`flex items-center gap-3 p-4 rounded-xl border ${card.color}`}>
                <div className="flex-shrink-0">{card.icon}</div>
                <div>
                  <p className="text-xs text-zinc-500">{card.label}</p>
                  <p className="font-semibold text-zinc-800 text-sm">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white border border-zinc-100 rounded-xl p-4 mb-5">
            <h2 className="text-sm font-medium text-zinc-700 mb-4">Entradas × Saídas por mês</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.months} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} />
                <YAxis tickFormatter={(v) => fmtCur.format(v)} tick={{ fontSize: 10, fill: '#71717a' }} width={72} />
                <RechartTooltip
                  formatter={(value: any) => fmtCurFull.format(Number(value))}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="entradas" name="Entradas" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="#f87171" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/60">
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Mês</th>
                    <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Saídas</th>
                    <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Entradas</th>
                    <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Saldo do mês</th>
                    <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Saldo acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.months.map((m, i) => (
                    <tr key={m.key} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/40'}>
                      <td className="px-4 py-2.5 font-medium text-zinc-700 capitalize">{m.label}</td>
                      <td className="px-4 py-2.5 text-right text-red-500">
                        {m.saidas > 0 ? fmtCurFull.format(m.saidas) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-green-600">
                        {m.entradas > 0 ? fmtCurFull.format(m.entradas) : '—'}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-medium ${m.saldo_mes >= 0 ? 'text-teal-600' : 'text-orange-500'}`}>
                        {fmtCurFull.format(m.saldo_mes)}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${m.saldo_acumulado >= 0 ? 'text-zinc-700' : 'text-red-500'}`}>
                        {fmtCurFull.format(m.saldo_acumulado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
