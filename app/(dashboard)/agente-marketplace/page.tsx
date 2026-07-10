'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot, Zap, MessageCircle, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, Activity, Play, Loader2,
} from 'lucide-react';
import Link from 'next/link';

// ─── tipos ────────────────────────────────────────────────────────────────────

interface AgentStatus {
  agentId: string;
  agentName: string;
  channel: string;
  status: 'active' | 'idle' | 'error';
  tasksGenerated: number;
  tasksApproved: number;
  tasksCompleted: number;
  errorCount: number;
  lastExecuted: string | null;
  successRate: number;
}

interface OrchestratorSummary {
  totalAgents: number;
  activeAgents: number;
  totalTasksGenerated: number;
  totalTasksApproved: number;
  totalTasksCompleted: number;
  overallSuccessRate: string | number;
}

interface StatusResponse {
  status: string;
  timestamp: string;
  summary: OrchestratorSummary;
  agents: AgentStatus[];
  report: string;
}

// ─── constantes ───────────────────────────────────────────────────────────────

const AGENT_META: Record<string, { label: string; channel: string; color: string; emoji: string }> = {
  alex:    { label: 'Alex',    channel: 'Amazon',        color: 'bg-orange-50 text-orange-700 border-orange-200',  emoji: '🇺🇸' },
  marina:  { label: 'Marina',  channel: 'Mercado Livre',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200',  emoji: '🛒' },
  sunny:   { label: 'Sunny',   channel: 'Shopee',         color: 'bg-red-50 text-red-700 border-red-200',           emoji: '🟠' },
  tren:    { label: 'Tren',    channel: 'Shein',          color: 'bg-purple-50 text-purple-700 border-purple-200',  emoji: '✨' },
  viral:   { label: 'Viral',   channel: 'TikTok Shop',    color: 'bg-pink-50 text-pink-700 border-pink-200',        emoji: '🎵' },
  premium: { label: 'Premium', channel: 'Kaway',          color: 'bg-teal-50 text-teal-700 border-teal-200',        emoji: '💎' },
};

const STATUS_CONFIG = {
  active: { label: 'Ativo',    icon: <CheckCircle2 className="w-3 h-3" />, cls: 'bg-green-100 text-green-700' },
  idle:   { label: 'Ocioso',   icon: <Clock className="w-3 h-3" />,        cls: 'bg-zinc-100 text-zinc-500' },
  error:  { label: 'Erro',     icon: <AlertTriangle className="w-3 h-3" />,cls: 'bg-red-100 text-red-600' },
};

function relativeTime(iso: string | null): string {
  if (!iso) return 'Nunca executado';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora mesmo';
  if (mins < 60) return `${mins} min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

// ─── componente ───────────────────────────────────────────────────────────────

export default function AgenteMasterPage() {
  const router = useRouter();
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);
  const [lastActivation, setLastActivation] = useState<string | null>(null);
  const [aiMissing, setAiMissing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/marketplace/orchestration/status');
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error('Erro ao carregar status');
      const json = await res.json();
      setData(json);
      setError('');
    } catch (err: any) {
      setError(err.message ?? 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
    // Verifica se as chaves de IA estão configuradas
    fetch('/api/marketplace/diagnostics/ai-status')
      .then(r => r.json())
      .then(d => setAiMissing(!d.anthropicConfigured && !d.openaiConfigured))
      .catch(() => {});
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handleActivate() {
    setActivating(true);
    try {
      const res = await fetch('/api/marketplace/orchestration/activate', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erro ao ativar');
      setLastActivation(new Date().toISOString());
      await fetchStatus();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setActivating(false);
    }
  }

  // ─── loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error || 'Erro inesperado'}</p>
          <button onClick={fetchStatus} className="mt-3 text-sm text-zinc-500 hover:text-zinc-700">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const { summary, agents } = data;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Aviso: chaves de IA não configuradas */}
      {aiMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Chaves de IA não configuradas</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Adicione <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> nas variáveis de ambiente do Vercel para ativar os agentes.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Agente Master — NEXO</h1>
            <p className="text-xs text-zinc-400">
              Atualizado {relativeTime(data.timestamp)} · {summary.totalAgents} agentes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/marketplace/chat"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Chat com NEXO
          </Link>

          <button
            onClick={handleActivate}
            disabled={activating}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {activating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Ativando...</>
            ) : (
              <><Play className="w-4 h-4" /> Ativar NEXO</>
            )}
          </button>
        </div>
      </div>

      {/* Última ativação */}
      {lastActivation && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700">
            Loop ativado com sucesso em {new Date(lastActivation).toLocaleString('pt-BR')}.
            Verifique as tarefas geradas em{' '}
            <Link href="/marketplace/aprovar" className="font-medium underline">Aprovar Tasks</Link>.
          </p>
        </div>
      )}

      {/* Resumo geral */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Agentes ativos</span>
          </div>
          <p className="text-2xl font-bold text-zinc-800">
            {summary.activeAgents}
            <span className="text-sm font-normal text-zinc-400">/{summary.totalAgents}</span>
          </p>
        </div>

        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Tasks geradas</span>
          </div>
          <p className="text-2xl font-bold text-zinc-800">{summary.totalTasksGenerated}</p>
        </div>

        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Aprovadas</span>
          </div>
          <p className="text-2xl font-bold text-zinc-800">{summary.totalTasksApproved}</p>
        </div>

        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Taxa de sucesso</span>
          </div>
          <p className={`text-2xl font-bold ${
            Number(summary.overallSuccessRate) >= 80 ? 'text-teal-600' :
            Number(summary.overallSuccessRate) >= 50 ? 'text-zinc-800' : 'text-red-600'
          }`}>
            {summary.overallSuccessRate}%
          </p>
        </div>
      </div>

      {/* Grid dos 6 agentes */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Agentes especializados
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents
            .filter(a => a.agentId !== 'nexo')
            .map((agent) => {
              const meta = AGENT_META[agent.agentId];
              const st = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
              const pct = agent.tasksGenerated > 0
                ? Math.round((agent.tasksCompleted / agent.tasksGenerated) * 100)
                : 0;

              return (
                <div
                  key={agent.agentId}
                  className="bg-white border border-zinc-100 rounded-xl p-4 hover:border-zinc-200 hover:shadow-sm transition-all"
                >
                  {/* Cabeçalho do agente */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta?.emoji ?? '🤖'}</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-800">
                          {agent.agentName || meta?.label || agent.agentId}
                        </p>
                        <p className="text-xs text-zinc-400">{meta?.channel ?? agent.channel}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${st.cls}`}>
                      {st.icon}
                      {st.label}
                    </span>
                  </div>

                  {/* Progresso */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>{agent.tasksCompleted}/{agent.tasksGenerated} concluídas</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats linha */}
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>{agent.tasksApproved} aprovadas</span>
                    {agent.errorCount > 0 && (
                      <span className="text-red-500">{agent.errorCount} erros</span>
                    )}
                    <span>{relativeTime(agent.lastExecuted)}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Relatório NEXO */}
      {data.report && (
        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-purple-500" />
            <p className="text-sm font-medium text-zinc-700">Relatório NEXO</p>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed whitespace-pre-wrap">{data.report}</p>
        </div>
      )}

      {/* Links rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/marketplace/chat',       label: 'Chat com NEXO',   icon: <MessageCircle className="w-4 h-4" /> },
          { href: '/marketplace/analysis',   label: 'Análises',         icon: <TrendingUp className="w-4 h-4" /> },
          { href: '/marketplace/aprovar',    label: 'Aprovar Tasks',    icon: <CheckCircle2 className="w-4 h-4" /> },
          { href: '/marketplace',            label: 'Marketplace',      icon: <Activity className="w-4 h-4" /> },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 bg-white border border-zinc-100 hover:border-teal-300 hover:shadow-sm rounded-xl p-3 transition-all text-sm font-medium text-zinc-700"
          >
            <span className="text-teal-600">{icon}</span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
