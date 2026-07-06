'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, AlertTriangle, Loader2, TrendingUp, Download } from 'lucide-react';
import { downloadCSV, todayISO } from '@lib/export-csv';

const TIPOS = [
  { value: 'materia-prima',     label: 'Matéria-prima' },
  { value: 'mao-de-obra',       label: 'Mão de obra' },
  { value: 'terceirizacao',     label: 'Terceirização' },
  { value: 'logistica',         label: 'Logística' },
  { value: 'embalagem',         label: 'Embalagem' },
  { value: 'marketing',         label: 'Marketing' },
  { value: 'taxas-marketplace', label: 'Taxas marketplace' },
];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

interface Cost {
  id: string;
  tipo: string;
  descricao: string | null;
  valor_planejado: number;
  valor_real: number;
  data_lancamento: string;
  created_at: string;
}

interface StageWithCosts {
  id: string;
  nome: string;
  ordem: number;
  costs: Cost[];
  total_planejado: number;
  total_real: number;
  desvio_pct: number | null;
  alerta: boolean;
  aviso: boolean;
}

const EMPTY_FORM = {
  tipo: 'materia-prima',
  descricao: '',
  valor_planejado: '',
  valor_real: '',
  data_lancamento: new Date().toISOString().split('T')[0],
};

function CostForm({
  stageId,
  onSaved,
  onCancel,
}: {
  stageId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.tipo) e.tipo = 'Obrigatório';
    if (form.valor_planejado === '' || Number(form.valor_planejado) < 0) e.valor_planejado = 'Valor inválido';
    if (!form.data_lancamento) e.data_lancamento = 'Obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/mvp/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_id: stageId,
          tipo: form.tipo,
          descricao: form.descricao || null,
          valor_planejado: Number(form.valor_planejado),
          valor_real: form.valor_real !== '' ? Number(form.valor_real) : 0,
          data_lancamento: form.data_lancamento,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErrors(d.errors ?? { geral: d.error });
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const field = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="mt-3 p-4 bg-zinc-50 rounded-lg border border-zinc-200 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Tipo */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Tipo *</label>
          <select
            value={form.tipo}
            onChange={(e) => field('tipo', e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {errors.tipo && <p className="text-xs text-red-500 mt-0.5">{errors.tipo}</p>}
        </div>

        {/* Data */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Data *</label>
          <input
            type="date"
            value={form.data_lancamento}
            onChange={(e) => field('data_lancamento', e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {errors.data_lancamento && <p className="text-xs text-red-500 mt-0.5">{errors.data_lancamento}</p>}
        </div>

        {/* Valor planejado */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Valor planejado (R$) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={form.valor_planejado}
            onChange={(e) => field('valor_planejado', e.target.value)}
            className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.valor_planejado ? 'border-red-400' : 'border-zinc-200'}`}
          />
          {errors.valor_planejado && <p className="text-xs text-red-500 mt-0.5">{errors.valor_planejado}</p>}
        </div>

        {/* Valor real */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Valor real (R$)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={form.valor_real}
            onChange={(e) => field('valor_real', e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Descrição */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-zinc-600 mb-1">Descrição</label>
          <input
            type="text"
            placeholder="Detalhes opcionais..."
            value={form.descricao}
            onChange={(e) => field('descricao', e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {errors.geral && <p className="text-xs text-red-500">{errors.geral}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          Salvar
        </button>
      </div>
    </div>
  );
}

function StageSection({
  stage,
  onRefresh,
}: {
  stage: StageWithCosts;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [addingCost, setAddingCost] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(costId: string) {
    setDeleting(costId);
    try {
      await fetch(`/api/mvp/costs/${costId}`, { method: 'DELETE' });
      onRefresh();
    } finally {
      setDeleting(null);
    }
  }

  const tipoLabel = (v: string) => TIPOS.find((t) => t.value === v)?.label ?? v;

  return (
    <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
      {/* Header da etapa */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-50 transition-colors"
      >
        <span className="text-zinc-400">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <span className="font-medium text-zinc-800 flex-1">
          {stage.ordem}. {stage.nome}
        </span>

        {/* Badges de alerta */}
        {stage.alerta && (
          <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Desvio {stage.desvio_pct?.toFixed(0)}%
          </span>
        )}
        {stage.aviso && !stage.alerta && (
          <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            Desvio {stage.desvio_pct?.toFixed(0)}%
          </span>
        )}

        {/* Totais resumidos */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-400 ml-2">
          <span>Plan: <strong className="text-zinc-600">{fmt(stage.total_planejado)}</strong></span>
          <span>Real: <strong className={stage.alerta ? 'text-red-600' : 'text-zinc-600'}>{fmt(stage.total_real)}</strong></span>
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-4 pb-4">
          {/* Lista de lançamentos */}
          {stage.costs.length > 0 ? (
            <div className="divide-y divide-zinc-50">
              {stage.costs.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-2.5 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                        {tipoLabel(c.tipo)}
                      </span>
                      {c.descricao && (
                        <span className="text-xs text-zinc-400 truncate">{c.descricao}</span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-zinc-400">
                      <span>Plan: <strong className="text-zinc-600">{fmt(c.valor_planejado)}</strong></span>
                      <span>Real: <strong className="text-zinc-600">{fmt(c.valor_real)}</strong></span>
                      <span>{fmtDate(c.data_lancamento)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-300 hover:text-red-500 rounded transition-all disabled:opacity-50"
                    aria-label="Remover lançamento"
                  >
                    {deleting === c.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 py-3 text-center">Nenhum lançamento nesta etapa.</p>
          )}

          {/* Totais da etapa */}
          {stage.costs.length > 0 && (
            <div className={`mt-2 pt-2 border-t flex items-center justify-between text-xs ${stage.alerta ? 'border-red-100' : 'border-zinc-100'}`}>
              <span className="text-zinc-400">Total da etapa</span>
              <div className="flex gap-4">
                <span>Plan: <strong className="text-zinc-700">{fmt(stage.total_planejado)}</strong></span>
                <span>Real: <strong className={stage.alerta ? 'text-red-600 font-semibold' : 'text-zinc-700'}>{fmt(stage.total_real)}</strong></span>
              </div>
            </div>
          )}

          {/* Formulário inline */}
          {addingCost ? (
            <CostForm
              stageId={stage.id}
              onSaved={() => { setAddingCost(false); onRefresh(); }}
              onCancel={() => setAddingCost(false)}
            />
          ) : (
            <button
              onClick={() => setAddingCost(true)}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar custo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CustosPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [stages, setStages] = useState<StageWithCosts[]>([]);
  const [grandPlanejado, setGrandPlanejado] = useState(0);
  const [grandReal, setGrandReal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/mvp/costs?product_id=${id}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Erro ao carregar custos');
      }
      const data = await res.json();
      setStages(data.stages ?? []);
      setGrandPlanejado(data.grand_planejado ?? 0);
      setGrandReal(data.grand_real ?? 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const desvioGeral = grandPlanejado > 0
    ? ((grandReal - grandPlanejado) / grandPlanejado) * 100
    : null;

  const totalCosts = stages.reduce((acc, s) => acc + s.costs.length, 0);

  function handleExportCSV() {
    const tipoLabel = (v: string) => TIPOS.find((t) => t.value === v)?.label ?? v;
    const rows = stages.flatMap((s) =>
      s.costs.map((c) => ({
        etapa: `${s.ordem}. ${s.nome}`,
        tipo: tipoLabel(c.tipo),
        descricao: c.descricao ?? '',
        valor_planejado: c.valor_planejado.toFixed(2),
        valor_real: c.valor_real.toFixed(2),
        data_lancamento: c.data_lancamento,
      }))
    );
    downloadCSV(`custos-${todayISO()}.csv`, rows, [
      { key: 'etapa',            label: 'Etapa' },
      { key: 'tipo',             label: 'Tipo' },
      { key: 'descricao',        label: 'Descrição' },
      { key: 'valor_planejado',  label: 'Valor Planejado (R$)' },
      { key: 'valor_real',       label: 'Valor Real (R$)' },
      { key: 'data_lancamento',  label: 'Data Lançamento' },
    ]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(`/produtos/${id}`)}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-zinc-900">Lançamento de Custos</h1>
          <p className="text-sm text-zinc-400">Custos planejados e reais por etapa de produção</p>
        </div>
        {totalCosts > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Totais gerais */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-zinc-100 rounded-xl p-4 text-center">
          <p className="text-xs text-zinc-400 mb-1">Total planejado</p>
          <p className="text-base font-semibold text-zinc-800">{fmt(grandPlanejado)}</p>
        </div>
        <div className="bg-white border border-zinc-100 rounded-xl p-4 text-center">
          <p className="text-xs text-zinc-400 mb-1">Total real</p>
          <p className={`text-base font-semibold ${desvioGeral !== null && desvioGeral > 15 ? 'text-red-600' : 'text-zinc-800'}`}>
            {fmt(grandReal)}
          </p>
        </div>
        <div className={`border rounded-xl p-4 text-center ${desvioGeral !== null && desvioGeral > 15 ? 'bg-red-50 border-red-200' : desvioGeral !== null && desvioGeral > 5 ? 'bg-orange-50 border-orange-200' : 'bg-white border-zinc-100'}`}>
          <p className="text-xs text-zinc-400 mb-1">Desvio geral</p>
          <p className={`text-base font-semibold ${desvioGeral !== null && desvioGeral > 15 ? 'text-red-600' : desvioGeral !== null && desvioGeral > 5 ? 'text-orange-600' : 'text-zinc-800'}`}>
            {desvioGeral !== null ? `${desvioGeral > 0 ? '+' : ''}${desvioGeral.toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Etapas */}
      <div className="space-y-3">
        {stages.map((stage) => (
          <StageSection key={stage.id} stage={stage} onRefresh={fetchData} />
        ))}
      </div>

      {stages.length === 0 && !error && (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-sm">Nenhuma etapa cadastrada para este produto.</p>
        </div>
      )}
    </div>
  );
}
