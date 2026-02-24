'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  Package,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Bell,
  Search,
  Upload,
  X,
  Loader,
  Play,
  BarChart3,
  Activity,
  Brain
} from 'lucide-react';

interface ChannelStatus {
  channel: string;
  name: string;
  icon: string;
  status: 'online' | 'offline' | 'warning';
  tasksCreated: number;
  tasksApproved: number;
  tasksCompleted: number;
  avgCompletionTime: number;
  performance: number; // 0-100%
}

interface MarketplaceStats {
  totalChannels: number;
  activeChannels: number;
  totalTasks: number;
  completedTasks: number;
  pendingApproval: number;
  averageCompletionTime: number;
}

const MARKETPLACE_CHANNELS = [
  { id: 'amazon', name: 'Amazon', icon: '🛒', color: 'from-orange-400 to-orange-600' },
  { id: 'shopee', name: 'Shopee', icon: '🏪', color: 'from-red-400 to-red-600' },
  { id: 'mercadolivre', name: 'MercadoLivre', icon: '🎯', color: 'from-yellow-400 to-yellow-600' },
  { id: 'shein', name: 'SHEIN', icon: '👗', color: 'from-pink-400 to-pink-600' },
  { id: 'tiktokshop', name: 'TikTok Shop', icon: '📱', color: 'from-black to-gray-700' },
  { id: 'kaway', name: 'Kaway', icon: '💎', color: 'from-purple-400 to-purple-600' },
];

interface NexoStatus {
  isActive: boolean;
  activeAgents: number;
  totalAgents: number;
  tasksGenerated: number;
  successRate: number;
  systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

export default function MarketplacePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [channelStatus, setChannelStatus] = useState<ChannelStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingAnalyses, setPendingAnalyses] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [nexoStatus, setNexoStatus] = useState<NexoStatus | null>(null);
  const [activatingNexo, setActivatingNexo] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (session && session.user.role && !['admin', 'head'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Fetch NEXO orchestrator status
  const fetchNexoStatus = async () => {
    try {
      const res = await fetch('/api/marketplace/orchestration/metrics');
      if (res.ok) {
        const data = await res.json();
        setNexoStatus({
          isActive: data.system.activeAgents > 0,
          activeAgents: data.system.activeAgents,
          totalAgents: data.system.totalAgents,
          tasksGenerated: data.system.totalTasksGenerated,
          successRate: data.system.totalTasksGenerated > 0
            ? (data.system.totalTasksCompleted / data.system.totalTasksGenerated) * 100
            : 0,
          systemHealth: data.system.systemHealth
        });
      }
    } catch (err) {
      console.error('Failed to fetch NEXO status:', err);
    }
  };

  // Activate NEXO
  const handleActivateNexo = async () => {
    try {
      setActivatingNexo(true);
      const res = await fetch('/api/marketplace/orchestration/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: ['amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway'],
        }),
      });

      if (res.ok) {
        await fetchNexoStatus();
        alert('✅ NEXO Orchestrator ativado! Agentes começando a gerar tarefas...');
      } else {
        const error = await res.json();
        alert(`❌ Erro: ${error.error}`);
      }
    } catch (err) {
      alert(`❌ Erro ao ativar NEXO: ${err}`);
    } finally {
      setActivatingNexo(false);
    }
  };

  // Fetch marketplace data
  useEffect(() => {
    async function fetchMarketplaceData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch NEXO status
        await fetchNexoStatus();

        // Fetch overview stats (real data from API)
        const statsResponse = await fetch('/api/marketplace/stats/overview');
        if (!statsResponse.ok) throw new Error('Erro ao buscar stats do marketplace');
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Fetch channel stats (real data from API)
        const channelsResponse = await fetch('/api/marketplace/stats/channels');
        if (!channelsResponse.ok) throw new Error('Erro ao buscar stats dos canais');
        const channelsData = await channelsResponse.json();
        setChannelStatus(channelsData.channels || []);

        // Fetch pending analyses
        const analysisResponse = await fetch('/api/marketplace/analysis?status=pending&limit=1');
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          setPendingAnalyses(analysisData.pendingCount || 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchMarketplaceData();
    }
  }, [session?.user]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setUploadFile(files[0]);
      setUploadError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadFile(files[0]);
      setUploadError(null);
    }
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleAnalyzeUpload = async () => {
    if (!uploadFile || selectedChannels.length === 0) {
      setUploadError('Selecione um arquivo e pelo menos um canal');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('channels', JSON.stringify(selectedChannels));

      const response = await fetch('/api/marketplace/analysis/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || errorData.error || 'Erro ao fazer upload'
        );
      }

      const result = await response.json();

      // Clear state and close modal
      setUploadFile(null);
      setSelectedChannels([]);
      setShowUploadModal(false);

      // Redirect to analysis page
      router.push(`/marketplace/analysis?planId=${result.planId}`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Zap className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando Marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Master (Nexo)</h1>
        </div>
        <p className="text-gray-600">Orquestrador Multi-Canal • Coordenação Estratégica de Marketplaces</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* NEXO Orchestrator Master Control */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🚀 NEXO Orchestrator Master</h2>
              <p className="text-gray-600 text-sm">Orquestração IA de 6 agentes especializados</p>
            </div>
          </div>
          {nexoStatus?.isActive && (
            <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
              <span className="text-green-700 font-semibold text-sm">ATIVO</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {/* Status Cards */}
          {nexoStatus && (
            <>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{nexoStatus.activeAgents}/{nexoStatus.totalAgents}</div>
                <div className="text-xs text-gray-600">Agentes Ativos</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">{nexoStatus.tasksGenerated}</div>
                <div className="text-xs text-gray-600">Tarefas Geradas</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">{nexoStatus.successRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-600">Taxa Sucesso</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className={`text-sm font-bold px-2 py-1 rounded ${
                  nexoStatus.systemHealth === 'excellent' ? 'bg-green-100 text-green-700' :
                  nexoStatus.systemHealth === 'good' ? 'bg-blue-100 text-blue-700' :
                  nexoStatus.systemHealth === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {nexoStatus.systemHealth.toUpperCase()}
                </div>
                <div className="text-xs text-gray-600 mt-2">Saúde Sistema</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                {nexoStatus.isActive ? (
                  <button
                    onClick={() => router.push('/marketplace/orchestration')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                  >
                    Ver Dashboard
                  </button>
                ) : (
                  <button
                    onClick={handleActivateNexo}
                    disabled={activatingNexo}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {activatingNexo ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Ativando...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Ativar NEXO
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Phase Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Phase 2 */}
          <Link
            href="/marketplace/orchestration"
            className="bg-white rounded-lg p-4 border-l-4 border-blue-500 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Phase 2</span>
            </div>
            <p className="text-sm text-gray-600">Dashboard em Tempo Real</p>
            <p className="text-xs text-gray-500 mt-1">Saúde + Performance de Agentes</p>
          </Link>

          {/* Phase 3 */}
          <Link
            href="/marketplace/tasks/execution"
            className="bg-white rounded-lg p-4 border-l-4 border-green-500 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">Phase 3</span>
            </div>
            <p className="text-sm text-gray-600">Execução de Tarefas</p>
            <p className="text-xs text-gray-500 mt-1">Progresso em Tempo Real (0-100%)</p>
          </Link>

          {/* Phase 4 */}
          <Link
            href="/marketplace/orchestration/optimization"
            className="bg-white rounded-lg p-4 border-l-4 border-purple-500 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Phase 4</span>
            </div>
            <p className="text-sm text-gray-600">Otimização com IA</p>
            <p className="text-xs text-gray-500 mt-1">ML Routing + Predições</p>
          </Link>

          {/* Orchestration */}
          <Link
            href="/marketplace/analysis"
            className="bg-white rounded-lg p-4 border-l-4 border-orange-500 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-gray-900">Análises</span>
            </div>
            <p className="text-sm text-gray-600">Planos Estratégicos</p>
            <p className="text-xs text-gray-500 mt-1">Insights + Recomendações</p>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Canais Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeChannels}/{stats.totalChannels}</p>
              </div>
              <Globe className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total de Tarefas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
              </div>
              <Package className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pendentes de Aprovação</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingApproval}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-teal-600">
                  {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-teal-500 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Channels Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Canais de Marketplace</h2>
          <Link
            href="/marketplace/tasks"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Ver Todas as Tarefas
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channelStatus.map((channel) => {
            const channelConfig = MARKETPLACE_CHANNELS.find((c) => c.id === channel.channel);
            return (
              <Link
                key={channel.channel}
                href={`/marketplace/channels/${channel.channel}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                {/* Channel Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{channel.icon}</div>
                    <div>
                      <h3 className="font-bold text-gray-900">{channel.name}</h3>
                      <p className="text-xs text-gray-500">
                        {channel.status === 'online' ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            Online
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-600">
                            <AlertCircle className="w-3 h-3" />
                            {channel.status === 'warning' ? 'Aviso' : 'Offline'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${channelConfig?.color || 'from-gray-400 to-gray-600'} flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">{channel.performance}%</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tarefas Criadas:</span>
                    <span className="font-semibold text-gray-900">{channel.tasksCreated}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Aprovadas:</span>
                    <span className="font-semibold text-gray-900">{channel.tasksApproved}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Concluídas:</span>
                    <span className="font-semibold text-teal-600">{channel.tasksCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tempo Médio:</span>
                    <span className="font-semibold text-gray-900">{channel.avgCompletionTime.toFixed(1)}h</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Pending Analysis Plans */}
      {pendingAnalyses > 0 && (
        <div className="mb-8">
          <Link
            href="/marketplace/analysis"
            className="block bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-200 rounded-lg p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 rounded-full p-3">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">Planos Aguardando Aprovação</h3>
                <p className="text-gray-700 text-sm mt-1">
                  {pendingAnalyses} plano{pendingAnalyses > 1 ? 's' : ''} estratégico{pendingAnalyses > 1 ? 's' : ''} gerado{pendingAnalyses > 1 ? 's' : ''} e aguardando sua análise
                </p>
              </div>
              <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                {pendingAnalyses}
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/marketplace/tasks?status=awaiting_approval"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-3"
          >
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="font-semibold text-gray-900">Pendentes de Aprovação</p>
              <p className="text-sm text-gray-600">{stats?.pendingApproval || 0} tarefas</p>
            </div>
          </Link>

          <Link
            href="/marketplace/tasks?status=in_progress"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-3"
          >
            <Zap className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-semibold text-gray-900">Em Execução</p>
              <p className="text-sm text-gray-600">Acompanhar progresso</p>
            </div>
          </Link>

          <Link
            href="/marketplace/analytics"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-3"
          >
            <TrendingUp className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-semibold text-gray-900">Analytics</p>
              <p className="text-sm text-gray-600">Métricas e relatórios</p>
            </div>
          </Link>

          <Link
            href="/marketplace/analysis"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-3"
          >
            <Search className="w-5 h-5 text-purple-500" />
            <div>
              <p className="font-semibold text-gray-900">Análises Estratégicas</p>
              <p className="text-sm text-gray-600">Planos de otimização</p>
            </div>
          </Link>

          <button
            onClick={() => setShowUploadModal(true)}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-3 text-left"
          >
            <Upload className="w-5 h-5 text-violet-500" />
            <div>
              <p className="font-semibold text-gray-900">Upload Análise</p>
              <p className="text-sm text-gray-600">PDFs e dados externos</p>
            </div>
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-violet-100 rounded-full p-2">
                    <Upload className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Upload de Análise
                    </h2>
                    <p className="text-sm text-gray-600">
                      PDF, TXT, CSV ou JSON (máx. 10MB)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadError(null);
                    setSelectedChannels([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Erro</p>
                    <p className="text-sm">{uploadError}</p>
                  </div>
                </div>
              )}

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition mb-6 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : uploadFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileSelect}
                  accept=".pdf,.txt,.csv,.json"
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {uploadFile ? (
                    <div className="space-y-2">
                      <div className="text-4xl">✅</div>
                      <p className="font-semibold text-green-700">
                        {uploadFile.name}
                      </p>
                      <p className="text-sm text-green-600">
                        {(uploadFile.size / 1024 / 1024).toFixed(2)}MB
                      </p>
                      <p className="text-xs text-green-600">
                        Clique para alterar arquivo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">📁</div>
                      <p className="font-semibold text-gray-900">
                        Arraste o arquivo aqui ou clique para selecionar
                      </p>
                      <p className="text-sm text-gray-600">
                        PDF, TXT, CSV ou JSON • Máximo 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Channel Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Selecionar Canais para Análise
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'amazon', label: 'Amazon', icon: '🛒' },
                    { id: 'mercadolivre', label: 'MercadoLivre', icon: '🎯' },
                    { id: 'shopee', label: 'Shopee', icon: '🏪' },
                    { id: 'shein', label: 'SHEIN', icon: '👗' },
                    { id: 'tiktok-shop', label: 'TikTok Shop', icon: '📱' },
                    { id: 'kaway', label: 'Kaway', icon: '💎' },
                  ].map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => toggleChannel(channel.id)}
                      className={`p-3 border-2 rounded-lg transition flex items-center gap-2 ${
                        selectedChannels.includes(channel.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 border-2 rounded flex items-center justify-center transition ${
                          selectedChannels.includes(channel.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedChannels.includes(channel.id) && (
                          <span className="text-white text-sm font-bold">✓</span>
                        )}
                      </div>
                      <span className="text-lg">{channel.icon}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {channel.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadError(null);
                    setSelectedChannels([]);
                  }}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAnalyzeUpload}
                  disabled={
                    uploading || !uploadFile || selectedChannels.length === 0
                  }
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      🚀 Analisar com Nexo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
