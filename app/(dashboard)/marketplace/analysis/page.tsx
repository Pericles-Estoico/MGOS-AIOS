'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Filter, RefreshCw, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalysisPlan {
  id: string;
  title: string;
  channels: string[];
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'done';
  plan_data: {
    summary: string;
    opportunities: any[];
    phases: any[];
    metrics: any[];
  };
  created_at: string;
  approved_at?: string;
  phase1_tasks_created?: boolean;
}

const VALID_CHANNELS = [
  { id: 'amazon', label: 'Amazon', color: 'bg-orange-100 text-orange-700' },
  { id: 'mercadolivre', label: 'MercadoLivre', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'shopee', label: 'Shopee', color: 'bg-red-100 text-red-700' },
  { id: 'shein', label: 'SHEIN', color: 'bg-purple-100 text-purple-700' },
  { id: 'tiktok-shop', label: 'TikTok Shop', color: 'bg-black text-white' },
  { id: 'kaway', label: 'Kaway', color: 'bg-blue-100 text-blue-700' },
];

const STATUS_CONFIG = {
  pending: { label: '⏳ Aguardando', color: 'bg-yellow-50 border-yellow-200' },
  approved: { label: '✅ Aprovado', color: 'bg-green-50 border-green-200' },
  rejected: { label: '❌ Rejeitado', color: 'bg-red-50 border-red-200' },
  executing: { label: '🚀 Em Execução', color: 'bg-blue-50 border-blue-200' },
  done: { label: '🎉 Concluído', color: 'bg-green-100 border-green-300' },
};

export default function AnalysisPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<AnalysisPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showNewAnalysisModal, setShowNewAnalysisModal] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch analysis plans
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedChannel) params.append('channel', selectedChannel);

      const response = await fetch(`/api/marketplace/analysis?${params}`);
      const data = await response.json();
      setPlans(data.plans || []);
      setPendingCount(data.pendingCount || 0);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedChannel]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleNewAnalysis = async () => {
    if (selectedChannels.length === 0) return;

    try {
      setIsRunning(true);
      const response = await fetch('/api/marketplace/analysis/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: selectedChannels }),
      });

      if (response.ok) {
        setShowNewAnalysisModal(false);
        setSelectedChannels([]);
        await fetchPlans();
        // Toast success
      } else {
        const error = await response.json();
        console.error('Error:', error);
      }
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleChannelSelection = (channelId: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(ch => ch !== channelId)
        : [...prev, channelId]
    );
  };

  const toggleAllChannels = () => {
    if (selectedChannels.length === VALID_CHANNELS.length) {
      setSelectedChannels([]);
    } else {
      setSelectedChannels(VALID_CHANNELS.map(ch => ch.id));
    }
  };

  const getChannelBadges = (channels: string[]) => {
    return channels.map(ch => {
      const config = VALID_CHANNELS.find(c => c.id === ch);
      return config ? (
        <span
          key={ch}
          className={`text-xs px-2 py-1 rounded-full ${config.color}`}
        >
          {config.label}
        </span>
      ) : null;
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `há ${diffMins}m`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays}d`;
    return format(date, 'dd MMM', { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            🔍 Análises de Marketplace
            {pendingCount > 0 && (
              <span className="bg-yellow-500 text-white text-sm px-2 py-1 rounded-full">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            Planos estratégicos gerados pelos agentes especializados
          </p>
        </div>
        <button
          onClick={() => setShowNewAnalysisModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          + Nova Análise
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
        <Filter size={20} className="text-gray-500" />

        {/* Status filter */}
        <select
          value={selectedStatus || ''}
          onChange={e => setSelectedStatus(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Todos os status</option>
          <option value="pending">Aguardando</option>
          <option value="approved">Aprovado</option>
          <option value="rejected">Rejeitado</option>
          <option value="executing">Em Execução</option>
          <option value="done">Concluído</option>
        </select>

        {/* Channel filter */}
        <select
          value={selectedChannel || ''}
          onChange={e => setSelectedChannel(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Todos os canais</option>
          {VALID_CHANNELS.map(ch => (
            <option key={ch.id} value={ch.id}>
              {ch.label}
            </option>
          ))}
        </select>

        {/* Refresh button */}
        <button
          onClick={() => fetchPlans()}
          disabled={loading}
          className="ml-auto p-2 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin text-gray-400' : 'text-gray-600'} />
        </button>
      </div>

      {/* Plans List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="mt-4 text-gray-600">Carregando análises...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Bell size={40} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">Nenhuma análise encontrada</p>
          <button
            onClick={() => setShowNewAnalysisModal(true)}
            className="mt-4 text-blue-600 hover:underline font-medium"
          >
            Criar a primeira análise
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => (
            <div
              key={plan.id}
              onClick={() => router.push(`/marketplace/analysis/${plan.id}`)}
              className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition ${
                STATUS_CONFIG[plan.status].color
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                    <span className="text-sm font-medium">
                      {STATUS_CONFIG[plan.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {plan.plan_data.summary}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {getChannelBadges(plan.channels)}
                  </div>
                  <div className="text-xs text-gray-600">
                    Criado {getTimeAgo(plan.created_at)}
                    {plan.approved_at && ` • Aprovado ${getTimeAgo(plan.approved_at)}`}
                    {plan.phase1_tasks_created && ' • ✅ Tarefas criadas'}
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Analysis Modal */}
      {showNewAnalysisModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Nova Análise</h2>

            {/* Channel Selection */}
            <div className="mb-6 space-y-3">
              <p className="text-sm font-medium text-gray-700">Selecione os canais:</p>

              {/* Select All Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedChannels.length === VALID_CHANNELS.length}
                  onChange={toggleAllChannels}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Selecionar Todos</span>
              </label>

              {/* Channel Checkboxes */}
              <div className="grid grid-cols-2 gap-2">
                {VALID_CHANNELS.map(ch => (
                  <label key={ch.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(ch.id)}
                      onChange={() => toggleChannelSelection(ch.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm">{ch.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowNewAnalysisModal(false);
                  setSelectedChannels([]);
                }}
                disabled={isRunning}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleNewAnalysis}
                disabled={selectedChannels.length === 0 || isRunning}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Executando...
                  </>
                ) : (
                  '🚀 Executar Análise'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
