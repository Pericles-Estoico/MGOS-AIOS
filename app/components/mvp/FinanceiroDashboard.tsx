'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartTooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface FinanceiroProps {
  productId: string;
  quantidade: number;
  initialData?: {
    preco_venda: number | null;
    taxa_canal: number | null;
    prazo_repasse_dias: number | null;
    data_venda_estimada: string | null;
  };
  grandPlanejado: number;
  grandReal: number;
  costsByTipo: Record<string, number>; // tipo → soma valor_real
}

const TIPO_LABELS: Record<string, string> = {
  'materia-prima': 'Matéria-prima',
  'mao-de-obra': 'Mão de obra',
  'terceirizacao': 'Terceirização',
  'logistica': 'Logística',
  'embalagem': 'Embalagem',
  'marketing': 'Marketing',
  'taxas-marketplace': 'Taxas marketplace',
};

const CHART_COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#6366f1'];

const fmtCur = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export function FinanceiroDashboard({
  productId,
  quantidade,
  initialData,
  grandPlanejado,
  grandReal,
  costsByTipo,
}: FinanceiroProps) {
  const [preco, setPreco] = useState(initialData?.preco_venda?.toString() ?? '');
  const [taxa, setTaxa] = useState(initialData?.taxa_canal?.toString() ?? '');
  const [prazo, setPrazo] = useState(initialData?.prazo_repasse_dias?.toString() ?? '');
  const [dataVenda, setDataVenda] = useState(initialData?.data_venda_estimada ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const precoNum = parseFloat(preco) || 0;
  const taxaNum = parseFloat(taxa) || 0;
  const prazoNum = parseInt(prazo, 10) || 0;

  const receita_bruta = precoNum * quantidade;
  const receita_liquida = receita_bruta * (1 - taxaNum / 100);
  const lucro = receita_liquida - grandReal;
  const margem = receita_liquida > 0 ? (lucro / receita_liquida) * 100 : null;
  const data_recebimento = dataVenda && prazoNum > 0 ? addDays(dataVenda, prazoNum) : null;

  const desvio = grandPlanejado > 0
    ? ((grandReal - grandPlanejado) / grandPlanejado) * 100
    : null;

  const pieData = useMemo(() => {
    return Object.entries(costsByTipo)
      .filter(([, val]) => val > 0)
      .map(([tipo, val]) => ({ name: TIPO_LABELS[tipo] ?? tipo, value: val }));
  }, [costsByTipo]);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/mvp/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preco_venda: preco === '' ? null : parseFloat(preco),
          taxa_canal: taxa === '' ? null : parseFloat(taxa),
          prazo_repasse_dias: prazo === '' ? null : parseInt(prazo, 10),
          data_venda_estimada: dataVenda || null,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Custos reais vs planejados */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-700 mb-3">Resumo de Custos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-50 rounded-lg p-3">
            <p className="text-xs text-zinc-400 mb-1">Custo planejado</p>
            <p className="text-base font-semibold text-zinc-800">{fmtCur.format(grandPlanejado)}</p>
          </div>
          <div className="bg-zinc-50 rounded-lg p-3">
            <p className="text-xs text-zinc-400 mb-1">Custo real</p>
            <p className="text-base font-semibold text-zinc-800">{fmtCur.format(grandReal)}</p>
          </div>
          <div className={`rounded-lg p-3 ${
            desvio !== null && desvio > 15
              ? 'bg-red-50'
              : desvio !== null && desvio > 5
              ? 'bg-orange-50'
              : 'bg-green-50'
          }`}>
            <p className="text-xs text-zinc-400 mb-1">Desvio (R$)</p>
            <p className={`text-base font-semibold ${
              desvio !== null && desvio > 5 ? 'text-red-700' : 'text-green-700'
            }`}>
              {grandReal >= grandPlanejado ? '+' : ''}{fmtCur.format(grandReal - grandPlanejado)}
            </p>
          </div>
          <div className={`rounded-lg p-3 ${
            desvio !== null && desvio > 15
              ? 'bg-red-50'
              : desvio !== null && desvio > 5
              ? 'bg-orange-50'
              : 'bg-green-50'
          }`}>
            <p className="text-xs text-zinc-400 mb-1">Desvio (%)</p>
            <p className={`text-base font-semibold ${
              desvio !== null && desvio > 5 ? 'text-red-700' : 'text-green-700'
            }`}>
              {desvio !== null ? fmtPct(desvio) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Campos financeiros editáveis */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-700 mb-3">Dados de Venda</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Preço de venda / un. (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="0,00"
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Taxa do canal (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={taxa}
              onChange={(e) => setTaxa(e.target.value)}
              placeholder="0,0"
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Prazo de repasse (dias)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              placeholder="D+X"
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Data de venda estimada</label>
            <input
              type="date"
              value={dataVenda}
              onChange={(e) => setDataVenda(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Cálculos automáticos */}
      {precoNum > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">Cálculos Automáticos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-50 rounded-lg p-3">
              <p className="text-xs text-zinc-400 mb-1">Receita bruta</p>
              <p className="text-base font-semibold text-zinc-800">{fmtCur.format(receita_bruta)}</p>
              <p className="text-xs text-zinc-400 mt-1">{quantidade} × {fmtCur.format(precoNum)}</p>
            </div>
            <div className="bg-zinc-50 rounded-lg p-3">
              <p className="text-xs text-zinc-400 mb-1">Receita líquida</p>
              <p className="text-base font-semibold text-zinc-800">{fmtCur.format(receita_liquida)}</p>
              <p className="text-xs text-zinc-400 mt-1">após {taxaNum}% taxa</p>
            </div>
            <div className={`rounded-lg p-3 ${lucro >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-xs text-zinc-400 mb-1">Lucro estimado</p>
              <p className={`text-base font-semibold ${lucro >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {fmtCur.format(lucro)}
              </p>
            </div>
            <div className={`rounded-lg p-3 ${
              margem !== null && margem >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className="text-xs text-zinc-400 mb-1">Margem</p>
              <p className={`text-base font-semibold ${
                margem !== null && margem >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {margem !== null ? fmtPct(margem) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data de recebimento */}
      {data_recebimento && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <p className="text-xs text-teal-600 font-medium mb-1">Estimativa de recebimento (D+{prazoNum})</p>
          <p className="text-xl font-bold text-teal-700" aria-label={`Data estimada de recebimento: ${fmtDate(data_recebimento)}`}>
            {fmtDate(data_recebimento)}
          </p>
          <p className="text-xs text-teal-500 mt-1">Venda: {fmtDate(dataVenda)} + {prazoNum} dias de repasse</p>
        </div>
      )}

      {/* Gráfico por tipo de custo */}
      {pieData.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">Distribuição de Custos por Tipo</h3>
          <div
            style={{ width: '100%', height: 280 }}
            role="img"
            aria-label="Gráfico de distribuição de custos reais por tipo"
          >
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  dataKey="value"
                  label={(props: any) =>
                    (props.percent ?? 0) > 0.05 ? `${((props.percent ?? 0) * 100).toFixed(0)}%` : ''
                  }
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartTooltip
                  formatter={(value: any) => fmtCur.format(Number(value))}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-zinc-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {pieData.length === 0 && grandReal === 0 && (
        <div className="text-center text-zinc-400 text-sm py-6">
          Nenhum custo real lançado ainda. Adicione custos nas etapas para ver a distribuição.
        </div>
      )}
    </div>
  );
}
