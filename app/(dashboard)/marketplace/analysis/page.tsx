'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Filter, RefreshCw, ChevronRight, Upload, Link, X, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Opportunity {
  title: string;
  description?: string;
  potential_revenue?: number;
  implementation_effort?: string;
}

interface Phase {
  number: number;
  name: string;
  tasks?: string[];
}

interface Metric {
  name: string;
  target?: number | string;
  current?: number | string;
}

interface AnalysisPlan {
  id: string;
  title: string;
  channels: string[];
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'done';
  plan_data: {
    summary: string;
    opportunities: Opportunity[];
    phases: Phase[];
    metrics: Metric[];
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

  // Listing analysis modal
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingTab, setListingTab] = useState<'image' | 'url'>('image');
  const [listingImage, setListingImage] = useState<File | null>(null);
  const [listingUrl, setListingUrl] = useState('');
  const [listingDragActive, setListingDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [listingResult, setListingResult] = useState<{
    marketplace: string;
    listingScore: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    tasksCount: number;
  } | null>(null);
  const [listingError, setListingError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MARKETPLACE_LABELS: Record<string, string> = {
    amazon: '🟠 Amazon',
    mercadolivre: '🟡 MercadoLivre',
    shopee: '🔴 Shopee',
    shein: '🟣 SHEIN',
    tiktokshop: '⚫ TikTok Shop',
    kaway: '🔵 Kaway',
  };

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

  const handleListingAnalysis = async () => {
    if (!listingImage && !listingUrl.trim()) return;

    setIsAnalyzing(true);
    setListingError('');
    setListingResult(null);

    try {
      const formData = new FormData();
      if (listingImage) formData.append('image', listingImage);
      if (listingUrl.trim()) formData.append('url', listingUrl.trim());

      const response = await fetch('/api/marketplace/analysis/listing', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setListingError(data.error || 'Erro na análise');
        return;
      }

      setListingResult({
        marketplace: data.detectedMarketplace,
        listingScore: data.analysis.listingScore,
        summary: data.analysis.summary,
        strengths: data.analysis.strengths,
        weaknesses: data.analysis.weaknesses,
        tasksCount: data.tasksCount,
      });
    } catch {
      setListingError('Erro ao conectar com o servidor');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleListingDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setListingDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setListingImage(file);
    }
  };

  const resetListingModal = () => {
    setListingImage(null);
    setListingUrl('');
    setListingResult(null);
    setListingError('');
    setListingTab('image');
    setShowListingModal(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowListingModal(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Upload size={16} />
            Analisar Produto
          </button>
          <button
            onClick={() => setShowNewAnalysisModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            + Nova Análise
          </button>
        </div>
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

      {/* Listing Analysis Modal */}
      {showListingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Upload size={16} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Analisar Produto</h2>
                  <p className="text-xs text-gray-500">Imagem ou URL do listing</p>
                </div>
              </div>
              <button onClick={resetListingModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {!listingResult ? (
              <div className="p-5 space-y-4">
                {/* Tabs */}
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setListingTab('image')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition ${
                      listingTab === 'image'
                        ? 'bg-violet-50 text-violet-700 border-b-2 border-violet-500'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Upload size={14} /> Imagem
                  </button>
                  <button
                    onClick={() => setListingTab('url')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition ${
                      listingTab === 'url'
                        ? 'bg-violet-50 text-violet-700 border-b-2 border-violet-500'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Link size={14} /> URL
                  </button>
                </div>

                {/* Image Tab */}
                {listingTab === 'image' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={e => setListingImage(e.target.files?.[0] || null)}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setListingDragActive(true); }}
                      onDragLeave={() => setListingDragActive(false)}
                      onDrop={handleListingDrop}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                        listingDragActive
                          ? 'border-violet-500 bg-violet-50'
                          : listingImage
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-300 hover:border-violet-400 hover:bg-violet-50'
                      }`}
                    >
                      {listingImage ? (
                        <div className="space-y-2">
                          <CheckCircle size={32} className="mx-auto text-green-500" />
                          <p className="font-medium text-green-700">{listingImage.name}</p>
                          <p className="text-xs text-gray-500">
                            {(listingImage.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <button
                            onClick={e => { e.stopPropagation(); setListingImage(null); }}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload size={32} className="mx-auto text-gray-400" />
                          <p className="text-sm font-medium text-gray-600">
                            Arraste um screenshot aqui
                          </p>
                          <p className="text-xs text-gray-400">
                            JPG, PNG, WebP · máx 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* URL Tab */}
                {listingTab === 'url' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">URL do produto</label>
                    <div className="relative">
                      <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="url"
                        value={listingUrl}
                        onChange={e => setListingUrl(e.target.value)}
                        placeholder="https://www.amazon.com.br/dp/..."
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                    {listingUrl && (() => {
                      try {
                        const hostname = new URL(listingUrl).hostname.replace(/^www\./, '');
                        const detected = hostname.includes('amazon') ? '🟠 Amazon'
                          : hostname.includes('mercadolivre') || hostname.includes('mercadolibre') ? '🟡 MercadoLivre'
                          : hostname.includes('shopee') ? '🔴 Shopee'
                          : hostname.includes('shein') ? '🟣 SHEIN'
                          : hostname.includes('tiktok') ? '⚫ TikTok Shop'
                          : hostname.includes('kaway') ? '🔵 Kaway'
                          : null;
                        return detected ? (
                          <p className="text-xs text-violet-700 bg-violet-50 px-2 py-1 rounded">
                            Detectado: {detected}
                          </p>
                        ) : null;
                      } catch { return null; }
                    })()}
                    <p className="text-xs text-gray-400">
                      Dica: se a URL não funcionar (marketplace bloqueou), use a aba Imagem
                    </p>
                  </div>
                )}

                {/* Both note */}
                <p className="text-xs text-center text-gray-400">
                  Pode usar imagem + URL juntos para análise mais completa
                </p>

                {/* Error */}
                {listingError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                    <p className="text-sm text-red-700">{listingError}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={resetListingModal}
                    disabled={isAnalyzing}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleListingAnalysis}
                    disabled={(!listingImage && !listingUrl.trim()) || isAnalyzing}
                    className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Analisando...
                      </>
                    ) : (
                      '🔍 Analisar'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Results */
              <div className="p-5 space-y-4">
                {/* Score */}
                <div className={`flex items-center justify-between p-3 rounded-lg ${getScoreColor(listingResult.listingScore)}`}>
                  <div>
                    <p className="text-xs font-medium opacity-70">Score do Listing</p>
                    <p className="text-2xl font-bold">{listingResult.listingScore}/100</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-70">Marketplace</p>
                    <p className="font-medium text-sm">
                      {MARKETPLACE_LABELS[listingResult.marketplace] || listingResult.marketplace}
                    </p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getScoreBarColor(listingResult.listingScore)}`}
                    style={{ width: `${listingResult.listingScore}%` }}
                  />
                </div>

                {/* Summary */}
                <p className="text-sm text-gray-700">{listingResult.summary}</p>

                {/* Strengths */}
                {listingResult.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">
                      ✓ Pontos Fortes
                    </p>
                    <ul className="space-y-1">
                      {listingResult.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {listingResult.weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wide">
                      ⚠ Melhorias Necessárias
                    </p>
                    <ul className="space-y-1">
                      {listingResult.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tasks created */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  ✅ <strong>{listingResult.tasksCount} tarefas</strong> criadas e aguardando aprovação
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={resetListingModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => router.push('/marketplace/tasks')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
                  >
                    Ver Tarefas <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
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
