'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  Package,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap
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

export default function MarketplacePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [channelStatus, setChannelStatus] = useState<ChannelStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (session && session.user.role && !['admin', 'head'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Fetch marketplace data
  useEffect(() => {
    async function fetchMarketplaceData() {
      try {
        setLoading(true);
        setError(null);

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
        </div>
      </div>
    </div>
  );
}
