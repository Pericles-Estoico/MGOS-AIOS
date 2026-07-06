'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const CATEGORIA_LABELS: Record<string, string> = {
  camiseta: 'Camiseta', calca: 'Calça', vestido: 'Vestido',
  conjunto: 'Conjunto', 'moda-infantil': 'Moda Infantil',
  jaqueta: 'Jaqueta', acessorio: 'Acessório',
};

interface Stage {
  id: string;
  nome: string;
  ordem: number;
  status: string;
  data_inicio_plan: string | null;
  data_fim_plan: string | null;
  data_inicio_real: string | null;
  data_fim_real: string | null;
  is_atrasada: boolean;
  historico: AuditEntry[];
}

interface AuditEntry {
  id: string;
  action: string;
  old_values: { status: string };
  new_values: { status: string; data_inicio_real?: string; data_fim_real?: string };
  changed_by: string;
  changed_at: string;
}

interface Product {
  id: string;
  nome: string;
  categoria: string;
  canal_venda: string;
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  planejada:    { label: 'Planejada',    icon: <Circle className="w-4 h-4" />,        color: 'text-zinc-400', bg: 'bg-zinc-100 text-zinc-600' },
  em_andamento: { label: 'Em andamento', icon: <Clock className="w-4 h-4" />,         color: 'text-blue-500', bg: 'bg-blue-100 text-blue-700' },
  concluida:    { label: 'Concluída',    icon: <CheckCircle2 className="w-4 h-4" />,  color: 'text-green-500', bg: 'bg-green-100 text-green-700' },
  atrasada:     { label: 'Atrasada',     icon: <AlertCircle className="w-4 h-4" />,   color: 'text-red-500', bg: 'bg-red-100 text-red-600' },
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

function StageRow({ stage, onAction }: { stage: Stage; onAction: (id: string, action: 'iniciar' | 'concluir') => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [histOpen, setHistOpen] = useState(false);

  const effectiveStatus = stage.is_atrasada && stage.status !== 'concluida' ? 'atrasada' : stage.status;
  const cfg = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG.planejada;

  async function handle(action: 'iniciar' | 'concluir') {
    setLoading(true);
    try { await onAction(stage.id, action); } finally { setLoading(false); }
  }

  return (
    <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        {/* Ordem + ícone */}
        <div className={`flex-shrink-0 ${cfg.color}`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-400" /> : cfg.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-zinc-800">{stage.ordem}. {stage.nome}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg}`}>
              {cfg.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-zinc-400">
            <span>Plan: {fmtDate(stage.data_inicio_plan)} → {fmtDate(stage.data_fim_plan)}</span>
            {stage.data_inicio_real && (
              <span className="text-blue-400">Real: {fmtDate(stage.data_inicio_real)}{stage.data_fim_real ? ` → ${fmtDate(stage.data_fim_real)}` : ' → ...'}</span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {stage.status === 'planejada' && (
            <button
              onClick={() => handle('iniciar')}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Iniciar
            </button>
          )}
          {stage.status === 'em_andamento' && (
            <button
              onClick={() => handle('concluir')}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Concluir
            </button>
          )}
          {stage.historico.length > 0 && (
            <button
              onClick={() => setHistOpen(!histOpen)}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors rounded"
              aria-label="Ver histórico"
            >
              {histOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Histórico */}
      {histOpen && stage.historico.length > 0 && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Histórico</p>
          {stage.historico.map((log) => (
            <div key={log.id} className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="text-zinc-300">·</span>
              <span>
                {log.old_values?.status} → <strong className="text-zinc-600">{log.new_values?.status}</strong>
              </span>
              <span className="text-zinc-300">·</span>
              <span>{new Date(log.changed_at).toLocaleString('pt-BR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EtapasPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [progresso, setProgresso] = useState(0);
  const [total, setTotal] = useState(0);
  const [concluidas, setConcluidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/mvp/products/${id}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Erro ao carregar produto');
      }
      const data = await res.json();
      setProduct(data.product);
      setStages(data.stages ?? []);
      setProgresso(data.progresso ?? 0);
      setTotal(data.total ?? 0);
      setConcluidas(data.concluidas ?? 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAction(stageId: string, action: 'iniciar' | 'concluir') {
    const res = await fetch(`/api/mvp/stages/${stageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      await fetchData();
    } else {
      const d = await res.json();
      alert(d.error ?? 'Erro ao atualizar etapa');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={() => router.push('/produtos')} className="mt-3 text-sm text-zinc-500 hover:text-zinc-700">
            ← Voltar para produtos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => router.push('/produtos')}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{product?.nome}</h1>
          <p className="text-sm text-zinc-400">
            {CATEGORIA_LABELS[product?.categoria ?? ''] ?? product?.categoria}
            {' · '}{product?.canal_venda}
          </p>
        </div>
      </div>

      {/* Progresso geral */}
      <div className="bg-white border border-zinc-100 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-zinc-700">Progresso geral</span>
          <span className="text-zinc-500">{concluidas}/{total} etapas · <strong className="text-teal-600">{progresso}%</strong></span>
        </div>
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Etapas */}
      <div className="space-y-2">
        {stages.map((stage) => (
          <StageRow key={stage.id} stage={stage} onAction={handleAction} />
        ))}
      </div>

      {stages.length === 0 && (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-sm">Nenhuma etapa cadastrada.</p>
          <Link href={`/produtos/novo`} className="text-xs text-teal-600 hover:underline mt-1 inline-block">
            Criar novo produto com etapas →
          </Link>
        </div>
      )}
    </div>
  );
}
