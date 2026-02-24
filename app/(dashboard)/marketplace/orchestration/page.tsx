'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Play, BarChart3, TrendingUp, AlertCircle, Zap } from 'lucide-react';

interface AgentMetrics {
  agentId: string;
  agentName: string;
  tasksGenerated: number;
  tasksApproved: number;
  tasksCompleted: number;
  approvalRate: number;
  completionRate: number;
  performanceScore: number;
  lastActivity: string | null;
}

interface SystemMetrics {
  timestamp: string;
  totalAgents: number;
  activeAgents: number;
  totalTasksGenerated: number;
  totalTasksCompleted: number;
  systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
  bottlenecks: string[];
  recommendations: string[];
}

export default function OrchestrationDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activating, setActivating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      setRefreshing(true);

      // Fetch system metrics
      const metricsRes = await fetch('/api/marketplace/orchestration/metrics');
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setSystemMetrics(data.system);
        setAgentMetrics(data.agents || []);
      } else if (metricsRes.status === 403) {
        setIsAdmin(false);
      } else if (metricsRes.status === 200) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMetrics();
    setLoading(false);
  }, []);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleActivateOrchestration = async () => {
    try {
      setActivating(true);
      const res = await fetch('/api/marketplace/orchestration/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: ['amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway'],
        }),
      });

      if (res.ok) {
        alert('✅ NEXO Orchestration ativado! Agentes estão gerando tarefas...');
        await fetchMetrics();
      } else {
        const error = await res.json();
        alert(`❌ Erro: ${error.error}`);
      }
    } catch (error) {
      alert(`❌ Erro ao ativar: ${error}`);
    } finally {
      setActivating(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🌐 NEXO Marketplace Orchestration</h1>
          <p className="text-gray-600 mt-1">Monitor e controle os 6 agentes especializados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchMetrics()}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
          {isAdmin && (
            <button
              onClick={handleActivateOrchestration}
              disabled={activating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {activating ? 'Ativando...' : 'Ativar NEXO'}
            </button>
          )}
        </div>
      </div>

      {/* System Health Card */}
      {systemMetrics && (
        <div className="border-2 rounded-lg p-6">
          <div className="flex items-center gap-2 text-xl font-semibold mb-4">
            <BarChart3 className="h-5 w-5" />
            Saúde do Sistema
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className={`px-3 py-2 rounded-lg ${getHealthColor(systemMetrics.systemHealth)} text-sm font-semibold mb-2`}>
                {systemMetrics.systemHealth.toUpperCase()}
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{systemMetrics.activeAgents}</div>
              <div className="text-xs text-gray-600">Agentes Ativos</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{systemMetrics.totalTasksGenerated}</div>
              <div className="text-xs text-gray-600">Tarefas Geradas</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{systemMetrics.totalTasksCompleted}</div>
              <div className="text-xs text-gray-600">Tarefas Completas</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {systemMetrics.totalTasksGenerated > 0
                  ? ((systemMetrics.totalTasksCompleted / systemMetrics.totalTasksGenerated) * 100).toFixed(1)
                  : 0}
                %
              </div>
              <div className="text-xs text-gray-600">Taxa Conclusão</div>
            </div>
          </div>
        </div>
      )}

      {/* Bottlenecks & Recommendations */}
      {systemMetrics && (systemMetrics.bottlenecks.length > 0 || systemMetrics.recommendations.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {systemMetrics.bottlenecks.length > 0 && (
            <div className="border rounded-lg p-6 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 text-red-700 font-semibold mb-3">
                <AlertCircle className="h-5 w-5" />
                ⚠️ Gargalos Identificados
              </div>
              <ul className="space-y-2">
                {systemMetrics.bottlenecks.map((bottleneck, i) => (
                  <li key={i} className="text-sm text-red-700">
                    • {bottleneck}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {systemMetrics.recommendations.length > 0 && (
            <div className="border rounded-lg p-6 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 font-semibold mb-3">
                <Zap className="h-5 w-5" />
                💡 Recomendações
              </div>
              <ul className="space-y-2">
                {systemMetrics.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-blue-700">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Agents Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">👥 Desempenho dos Agentes</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agentMetrics.map((agent) => (
            <div key={agent.agentId} className={`border rounded-lg p-4 ${getScoreBg(agent.performanceScore)}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold">{agent.agentName}</div>
                  <div className="text-xs text-gray-600">
                    {['amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway'][
                      ['alex', 'marina', 'sunny', 'tren', 'viral', 'premium'].indexOf(agent.agentId)
                    ]}
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-600">{agent.performanceScore}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <div className="text-gray-600 text-xs">Geradas</div>
                  <div className="font-semibold">{agent.tasksGenerated}</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs">Aprovadas</div>
                  <div className="font-semibold">{agent.tasksApproved}</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs">Completas</div>
                  <div className="font-semibold">{agent.tasksCompleted}</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs">Rejeitadas</div>
                  <div className="font-semibold">{agent.tasksGenerated - agent.tasksApproved}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Taxa Aprovação</span>
                    <span className="font-semibold">{agent.approvalRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min(agent.approvalRate, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Taxa Conclusão</span>
                    <span className="font-semibold">{agent.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(agent.completionRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {agent.lastActivity && (
                <div className="text-xs text-gray-500 pt-2 border-t mt-2">
                  Última: {new Date(agent.lastActivity).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Auto-refresh toggle */}
      <div className="flex items-center justify-end gap-2 text-sm">
        <input
          type="checkbox"
          id="autoRefresh"
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
          className="cursor-pointer"
        />
        <label htmlFor="autoRefresh" className="cursor-pointer text-gray-600">
          Auto-atualizar a cada 30 segundos
        </label>
      </div>
    </div>
  );
}
