'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ArrowLeft,
  Zap
} from 'lucide-react';

interface ChannelMetrics {
  channelName: string;
  channelIcon: string;
  agentName: string;
  status: 'online' | 'offline' | 'warning';
  taskStats: {
    created: number;
    approved: number;
    inProgress: number;
    completed: number;
    rejected: number;
    avgCompletionTime: number;
  };
  performanceMetrics: {
    approvalRate: number;
    completionRate: number;
    qualityScore: number;
    avgEfficiency: number;
  };
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
}

const CHANNEL_CONFIG = {
  amazon: {
    name: 'Amazon',
    icon: '🛒',
    color: 'from-orange-400 to-orange-600',
    agent: 'marketplace-amazon',
    agentName: 'Agent Amazon',
    description: 'Otimização de títulos GEO, Conteúdo A+, Gerenciamento de Anúncios',
  },
  shopee: {
    name: 'Shopee',
    icon: '🏪',
    color: 'from-red-400 to-red-600',
    agent: 'marketplace-shopee',
    agentName: 'Agent Shopee',
    description: 'Flash Sales, Conteúdo em Vídeo, Otimização de Anúncios',
  },
  mercadolivre: {
    name: 'MercadoLivre',
    icon: '🎯',
    color: 'from-yellow-400 to-yellow-600',
    agent: 'marketplace-mercadolivre',
    agentName: 'Agent MercadoLivre',
    description: 'Descrições Geo, Otimização de Anúncios, Visibilidade',
  },
  shein: {
    name: 'SHEIN',
    icon: '👗',
    color: 'from-pink-400 to-pink-600',
    agent: 'marketplace-shein',
    agentName: 'Agent SHEIN',
    description: 'Otimização de Tendências, Análise de Moda',
  },
  tiktokshop: {
    name: 'TikTok Shop',
    icon: '📱',
    color: 'from-black to-gray-700',
    agent: 'marketplace-tiktokshop',
    agentName: 'Agent TikTok Shop',
    description: 'Comércio ao Vivo, Parcerias com Criadores',
  },
  kaway: {
    name: 'Kaway',
    icon: '💎',
    color: 'from-purple-400 to-purple-600',
    agent: 'marketplace-kaway',
    agentName: 'Agent Kaway',
    description: 'Posicionamento Premium, Ofertas Exclusivas',
  },
};

export default function ChannelDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const channel = (params?.channel || '').toString() as keyof typeof CHANNEL_CONFIG;

  const [metrics, setMetrics] = useState<ChannelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = CHANNEL_CONFIG[channel];

  // Redirect if not admin
  useEffect(() => {
    if (session && session.user.role && !['admin', 'head'].includes(session.user.role)) {
      router.push('/marketplace');
    }
  }, [session, router]);

  // Fetch channel metrics
  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        setError(null);

        // Mock data - será substituído por API real
        const mockMetrics: ChannelMetrics = {
          channelName: config?.name || 'Unknown',
          channelIcon: config?.icon || '?',
          agentName: config?.agentName || 'Unknown Agent',
          status: 'online',
          taskStats: {
            created: Math.floor(Math.random() * 50) + 10,
            approved: Math.floor(Math.random() * 40) + 5,
            inProgress: Math.floor(Math.random() * 15) + 2,
            completed: Math.floor(Math.random() * 30) + 5,
            rejected: Math.floor(Math.random() * 5),
            avgCompletionTime: Math.random() * 5 + 2,
          },
          performanceMetrics: {
            approvalRate: Math.floor(Math.random() * 30) + 75,
            completionRate: Math.floor(Math.random() * 20) + 80,
            qualityScore: Math.floor(Math.random() * 15) + 85,
            avgEfficiency: Math.floor(Math.random() * 25) + 75,
          },
          recentTasks: [
            {
              id: '1',
              title: 'Otimizar título do produto',
              status: 'completed',
              priority: 'high',
              createdAt: new Date().toISOString(),
            },
            {
              id: '2',
              title: 'Analisar conteúdo A+',
              status: 'in_progress',
              priority: 'medium',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: '3',
              title: 'Criar anúncio patrocinado',
              status: 'awaiting_approval',
              priority: 'high',
              createdAt: new Date(Date.now() - 7200000).toISOString(),
            },
          ],
        };

        setMetrics(mockMetrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    if (config && session?.user) {
      fetchMetrics();
    }
  }, [channel, config, session?.user]);

  if (!config) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 font-medium">Canal não encontrado</p>
        <Link href="/marketplace" className="text-blue-600 hover:underline mt-4">
          Voltar ao Marketplace
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Carregando informações do canal...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/marketplace" className="text-blue-600 hover:text-blue-700">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{config.icon}</span>
            <h1 className="text-3xl font-bold text-gray-900">{config.name}</h1>
          </div>
          <p className="text-gray-600">{config.description}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Agent Info */}
      {metrics && (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Agente Especializado</p>
                <p className="text-xl font-bold text-gray-900">{metrics.agentName}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  {metrics.status === 'online' ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                      <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                      Offline
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Tarefas Criadas</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.taskStats.created}</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Concluídas</p>
                  <p className="text-2xl font-bold text-teal-600">{metrics.taskStats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-teal-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Tempo Médio</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.taskStats.avgCompletionTime.toFixed(1)}h</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Métricas de Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-medium">Taxa de Aprovação</span>
                    <span className="text-gray-900 font-bold">{metrics.performanceMetrics.approvalRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${metrics.performanceMetrics.approvalRate}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-medium">Taxa de Conclusão</span>
                    <span className="text-gray-900 font-bold">{metrics.performanceMetrics.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${metrics.performanceMetrics.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-medium">Score de Qualidade</span>
                    <span className="text-gray-900 font-bold">{metrics.performanceMetrics.qualityScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${metrics.performanceMetrics.qualityScore}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-medium">Eficiência Média</span>
                    <span className="text-gray-900 font-bold">{metrics.performanceMetrics.avgEfficiency}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{ width: `${metrics.performanceMetrics.avgEfficiency}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Distribuição de Tarefas</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Aprovadas:</span>
                  <span className="font-bold text-blue-600">{metrics.taskStats.approved}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Em Progresso:</span>
                  <span className="font-bold text-cyan-600">{metrics.taskStats.inProgress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Concluídas:</span>
                  <span className="font-bold text-green-600">{metrics.taskStats.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Rejeitadas:</span>
                  <span className="font-bold text-red-600">{metrics.taskStats.rejected}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tarefas Recentes</h3>
            <div className="space-y-3">
              {metrics.recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(task.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      task.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {task.status === 'completed'
                      ? 'Concluída'
                      : task.status === 'in_progress'
                        ? 'Em Progresso'
                        : 'Awaiting Approval'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
