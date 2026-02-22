'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2, Zap } from 'lucide-react';

interface Agent {
  name: string;
  icon: string;
  channel: string;
  status: 'online' | 'busy' | 'idle';
  lastAction?: string;
  tasksGenerated?: number;
}

interface Props {
  onRunLoop: () => Promise<void>;
  isLoading: boolean;
}

export default function AgentStatusPanel({ onRunLoop, isLoading }: Props) {
  const [agents, setAgents] = useState<Agent[]>([
    {
      name: 'Alex',
      icon: '📦',
      channel: 'Amazon',
      status: 'online',
      lastAction: 'há 6 horas',
      tasksGenerated: 7,
    },
    {
      name: 'Marina',
      icon: '🏪',
      channel: 'MercadoLivre',
      status: 'online',
      lastAction: 'há 6 horas',
      tasksGenerated: 8,
    },
    {
      name: 'Sunny',
      icon: '🎥',
      channel: 'Shopee',
      status: 'online',
      lastAction: 'há 6 horas',
      tasksGenerated: 5,
    },
    {
      name: 'Tren',
      icon: '⚡',
      channel: 'Shein',
      status: 'online',
      lastAction: 'há 6 horas',
      tasksGenerated: 6,
    },
    {
      name: 'Viral',
      icon: '📱',
      channel: 'TikTok Shop',
      status: 'online',
      lastAction: 'há 6 horas',
      tasksGenerated: 8,
    },
    {
      name: 'Premium',
      icon: '✨',
      channel: 'Kaway',
      status: 'online',
      lastAction: 'há 6 horas',
      tasksGenerated: 8,
    },
  ]);

  const [loopStatus, setLoopStatus] = useState({
    lastExecution: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    nextExecution: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    totalTasksLast24h: 42,
  });

  useEffect(() => {
    // Fetch loop status
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/marketplace/autonomous/status');
        const data = await response.json();
        if (data.success) {
          setLoopStatus({
            lastExecution: data.status.lastExecution,
            nextExecution: data.status.nextExecution,
            totalTasksLast24h: data.status.tasksGeneratedLast24h,
          });
        }
      } catch (error) {
        console.error('Error fetching loop status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'busy':
        return <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />;
      case 'idle':
        return <AlertCircle className="w-3 h-3 text-gray-400" />;
      default:
        return <AlertCircle className="w-3 h-3 text-red-500" />;
    }
  };

  const lastExecTime = new Date(loopStatus.lastExecution);
  const nextExecTime = new Date(loopStatus.nextExecution);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>👑</span> Squad
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          6 agentes especializados prontos
        </p>
      </div>

      {/* Agents List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {agents.map((agent, i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{agent.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {agent.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {agent.channel}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(agent.status)}
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Última ação: {agent.lastAction}</span>
                {agent.tasksGenerated && (
                  <span className="font-medium">
                    {agent.tasksGenerated} tarefas
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loop Status */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Loop Autônomo
            </p>
          </div>
          <div className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Última execução:</span>
              <br />
              <span className="font-mono">
                {lastExecTime.toLocaleString('pt-BR')}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Próxima execução:</span>
              <br />
              <span className="font-mono">
                {nextExecTime.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="pt-1">
              <span className="text-gray-600 dark:text-gray-400">
                Tarefas (24h):
              </span>{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {loopStatus.totalTasksLast24h}
              </span>
            </div>
          </div>
        </div>

        {/* Run Loop Button */}
        <Button
          onClick={onRunLoop}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Executando...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Executar Loop Agora
            </>
          )}
        </Button>

        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          Trigger manual para gerar tarefas imediatamente
        </p>
      </div>
    </div>
  );
}
