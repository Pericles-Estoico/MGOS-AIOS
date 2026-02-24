'use client';

import { Card } from '@/components/ui/card';
import { Activity, TrendingUp } from 'lucide-react';

interface OrchestrationCardProps {
  activeAgents: number;
  totalAgents: number;
  tasksGenerated: number;
  successRate: number;
  systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
  isLoading?: boolean;
}

export function OrchestrationCard({
  activeAgents,
  totalAgents,
  tasksGenerated,
  successRate,
  systemHealth,
  isLoading = false,
}: OrchestrationCardProps) {
  const getHealthBadgeColor = (health: string) => {
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

  const healthLabels = {
    excellent: '✅ Excelente',
    good: '✅ Bom',
    fair: '⚠️ Aceitável',
    poor: '❌ Crítico',
  };

  return (
    <Card className={isLoading ? 'opacity-50' : ''}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">NEXO Orquestração</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getHealthBadgeColor(systemHealth)}`}>
            {healthLabels[systemHealth as keyof typeof healthLabels]}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Agentes Ativos</p>
            <p className="text-2xl font-bold text-blue-600">
              {activeAgents}/{totalAgents}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-600">Tarefas Geradas</p>
            <p className="text-2xl font-bold text-green-600">{tasksGenerated}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-600">Taxa de Sucesso</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-purple-600">{successRate.toFixed(1)}%</p>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-600">Status</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm font-medium">Online</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
