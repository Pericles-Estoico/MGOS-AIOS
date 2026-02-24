'use client';

import { useState, useEffect, useCallback } from 'react';

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

interface UseOrchestrationMetricsReturn {
  systemMetrics: SystemMetrics | null;
  agentMetrics: AgentMetrics[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefreshing: boolean;
}

export function useOrchestrationMetrics(
  intervalSeconds: number = 30,
  autoRefresh: boolean = true
): UseOrchestrationMetricsReturn {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const response = await fetch('/api/marketplace/orchestration/metrics', {
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Não autenticado');
        } else if (response.status === 403) {
          setError('Sem permissão para visualizar métricas');
        } else {
          setError('Erro ao carregar métricas');
        }
        return;
      }

      const data = await response.json();
      setSystemMetrics(data.system);
      setAgentMetrics(data.agents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || intervalSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      fetchMetrics();
    }, intervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, intervalSeconds, fetchMetrics]);

  return {
    systemMetrics,
    agentMetrics,
    loading,
    error,
    refetch: fetchMetrics,
    isRefreshing,
  };
}
