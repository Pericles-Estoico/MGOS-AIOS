'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, AlertTriangle, Zap, Brain, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AgentOptimization {
  agentId: string;
  agentName: string;
  baseScore: number;
  adaptiveWeights: {
    approvalRate: number;
    completionRate: number;
    executionTime: number;
  };
  predictedPerformance: number;
  recommendedAction: 'increase_workload' | 'maintain' | 'reduce_workload' | 'retrain';
  lastOptimization: string;
}

interface OptimizationSummary {
  agentsNeedingRetraining: number;
  agentsReadyToScale: number;
  averagePredictedPerformance: number;
}

export default function OptimizationDashboard() {
  const [optimizations, setOptimizations] = useState<AgentOptimization[]>([]);
  const [summary, setSummary] = useState<OptimizationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch optimization metrics
  const fetchOptimizations = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/marketplace/orchestration/optimization');
      if (res.ok) {
        const data = await res.json();
        setOptimizations(data.optimizations || []);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch optimizations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOptimizations();
    setLoading(false);
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchOptimizations();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'increase_workload':
        return 'bg-green-50 border-green-200';
      case 'maintain':
        return 'bg-blue-50 border-blue-200';
      case 'reduce_workload':
        return 'bg-yellow-50 border-yellow-200';
      case 'retrain':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      increase_workload: '📈 Aumentar Workload',
      maintain: '⚖️ Manter',
      reduce_workload: '📉 Reduzir Workload',
      retrain: '🔄 Retreinar',
    };
    return labels[action] || action;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'increase_workload':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'reduce_workload':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'retrain':
        return <Zap className="h-5 w-5 text-red-600" />;
      default:
        return <Target className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTrendColor = (current: number, predicted: number) => {
    const trend = predicted - current;
    if (trend > 5) return 'text-green-600';
    if (trend < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendArrow = (current: number, predicted: number) => {
    const trend = predicted - current;
    if (trend > 5) return '↗️';
    if (trend < -5) return '↘️';
    return '→';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧠 Otimização Avançada NEXO</h1>
          <p className="text-gray-600 mt-1">ML-based routing & adaptive weighting</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchOptimizations()}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-2 border-purple-200 bg-purple-50">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-600">Performance Média Prevista</span>
            </div>
            <div className="text-3xl font-bold text-purple-600">{summary.averagePredictedPerformance}%</div>
            <div className="text-xs text-gray-600 mt-2">Próximo período</div>
          </Card>

          <Card className="p-4 border-2 border-green-200 bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold text-green-600">Pronto para Escalar</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{summary.agentsReadyToScale}</div>
            <div className="text-xs text-gray-600 mt-2">Agentes</div>
          </Card>

          <Card className="p-4 border-2 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-red-600" />
              <span className="text-sm font-semibold text-red-600">Precisam Retreinar</span>
            </div>
            <div className="text-3xl font-bold text-red-600">{summary.agentsNeedingRetraining}</div>
            <div className="text-xs text-gray-600 mt-2">Agentes</div>
          </Card>

          <Card className="p-4 border-2 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">Total Otimizado</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">{optimizations.length}</div>
            <div className="text-xs text-gray-600 mt-2">Agentes</div>
          </Card>
        </div>
      )}

      {/* Optimization Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">📊 Análise de Agentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {optimizations.map((opt) => (
            <Card key={opt.agentId} className={`p-4 border-2 ${getActionColor(opt.recommendedAction)}`}>
              {/* Agent Name & Current Score */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-lg">{opt.agentName}</div>
                  <div className="text-xs text-gray-600">{opt.agentId}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{opt.baseScore}/100</div>
                  <div className="text-xs text-gray-600">Score Atual</div>
                </div>
              </div>

              {/* Performance Trend */}
              <div className="mb-4 pb-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-600">Performance Prevista</span>
                  <span className={`text-lg font-bold ${getTrendColor(opt.baseScore, opt.predictedPerformance)}`}>
                    {getTrendArrow(opt.baseScore, opt.predictedPerformance)} {opt.predictedPerformance}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${opt.predictedPerformance}%` }}
                  />
                </div>
              </div>

              {/* Adaptive Weights */}
              <div className="mb-4 pb-4 border-b">
                <div className="text-xs font-semibold text-gray-600 mb-2">Pesos Adaptativos</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Taxa Aprovação</span>
                    <span className="font-semibold">{(opt.adaptiveWeights.approvalRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-green-500 h-1 rounded-full"
                      style={{ width: `${opt.adaptiveWeights.approvalRate * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between mt-2">
                    <span>Taxa Conclusão</span>
                    <span className="font-semibold">{(opt.adaptiveWeights.completionRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-purple-500 h-1 rounded-full"
                      style={{ width: `${opt.adaptiveWeights.completionRate * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between mt-2">
                    <span>Tempo Execução</span>
                    <span className="font-semibold">{(opt.adaptiveWeights.executionTime * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-orange-500 h-1 rounded-full"
                      style={{ width: `${opt.adaptiveWeights.executionTime * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="flex items-center gap-2">
                {getActionIcon(opt.recommendedAction)}
                <div>
                  <div className="font-semibold text-sm">{getActionLabel(opt.recommendedAction)}</div>
                  <div className="text-xs text-gray-600">
                    {new Date(opt.lastOptimization).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <Card className="p-6 bg-blue-50 border-2 border-blue-200">
        <div className="flex gap-4">
          <Brain className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Como Funciona a Otimização?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>
                <strong>Pesos Adaptativos:</strong> Ajustam-se automaticamente com base no histórico de performance.
                Se uma taxa está baixa, seu peso aumenta.
              </li>
              <li>
                <strong>Predição:</strong> Usa regressão linear nos últimos 30 dias para prever performance futura.
              </li>
              <li>
                <strong>Recomendações:</strong> Sugere aumentar workload (score ≥80), manter, reduzir (&lt;70) ou
                retreinar (&lt;50).
              </li>
              <li>
                <strong>Routing Inteligente:</strong> Recomenda o melhor agente para cada tipo de tarefa baseado em
                especialização e histórico.
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Auto-refresh toggle */}
      <div className="flex items-center justify-end gap-2 text-sm border-t pt-4">
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
