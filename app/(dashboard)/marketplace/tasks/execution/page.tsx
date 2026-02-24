'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Play, Pause, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TaskExecution {
  taskId: string;
  status: 'pending' | 'in_progress' | 'marketplace_sync' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  marketplace: string;
  channel: string;
  agentId: string;
  timeEstimate: number;
  timeSpent: number;
  lastUpdate: string;
  syncStatus?: {
    amazon?: boolean;
    mercadolivre?: boolean;
    shopee?: boolean;
    shein?: boolean;
    tiktokshop?: boolean;
    kaway?: boolean;
  };
  error?: string;
}

interface ExecutionSummary {
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
  totalProgress: number;
}

export default function TaskExecutionDashboard() {
  const [tasks, setTasks] = useState<TaskExecution[]>([]);
  const [summary, setSummary] = useState<ExecutionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'failed'>('all');
  const [selectedChannel, setSelectedChannel] = useState<string | 'all'>('all');

  // Fetch task execution status
  const fetchTasks = async () => {
    try {
      setRefreshing(true);
      let url = '/api/marketplace/orchestration/task-execution?limit=100';

      if (filter !== 'all') {
        url += `&status=${filter}`;
      }
      if (selectedChannel !== 'all') {
        url += `&channel=${selectedChannel}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTasks();
    setLoading(false);
  }, []);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTasks();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, filter, selectedChannel]);

  // Update filter
  useEffect(() => {
    fetchTasks();
  }, [filter, selectedChannel]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Play className="h-5 w-5 text-blue-600" />;
      case 'marketplace_sync':
        return <Zap className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Pause className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200';
      case 'marketplace_sync':
        return 'bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Aguardando',
      in_progress: 'Em Progresso',
      marketplace_sync: 'Sincronizando',
      completed: 'Concluído',
      failed: 'Falha',
    };
    return labels[status] || status;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${Math.round(mins)}min`;
  };

  const channels = ['all', 'amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway'];
  const statuses: Array<'all' | 'pending' | 'in_progress' | 'completed' | 'failed'> = [
    'all',
    'pending',
    'in_progress',
    'completed',
    'failed',
  ];

  const filteredTasks = tasks.filter((task) => {
    if (filter !== 'all' && task.status !== filter) return false;
    if (selectedChannel !== 'all' && task.channel !== selectedChannel) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Execução de Tarefas</h1>
          <p className="text-gray-600 mt-1">Monitor de progresso em tempo real</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchTasks()}
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{summary.pending}</div>
              <div className="text-xs text-gray-600 mt-1">Aguardando</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-gray-600 h-1 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.inProgress}</div>
              <div className="text-xs text-gray-600 mt-1">Em Progresso</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-blue-600 h-1 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
              <div className="text-xs text-gray-600 mt-1">Concluído</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-green-600 h-1 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
              <div className="text-xs text-gray-600 mt-1">Falha</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-red-600 h-1 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summary.totalProgress}%</div>
              <div className="text-xs text-gray-600 mt-1">Progresso Total</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-purple-600 h-1 rounded-full" style={{ width: `${summary.totalProgress}%` }} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-semibold text-gray-700">Status</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Todas' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">Canal</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {channels.map((channel) => (
              <button
                key={channel}
                onClick={() => setSelectedChannel(channel)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedChannel === channel
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {channel === 'all' ? 'Todos' : channel.charAt(0).toUpperCase() + channel.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Tarefas ({filteredTasks.length})</h2>
        {filteredTasks.length === 0 ? (
          <Card className="p-6 text-center text-gray-600">
            Nenhuma tarefa encontrada com os filtros selecionados.
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <Card key={task.taskId} className={`p-4 border ${getStatusColor(task.status)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(task.status)}
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{task.taskId}</div>
                      <div className="text-xs text-gray-600">
                        {task.channel.toUpperCase()} • {task.agentId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{getStatusLabel(task.status)}</div>
                    <div className="text-xs text-gray-600">{task.progress}% concluído</div>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-3 w-3" />
                    {formatTime(task.timeSpent)} / {formatTime(task.timeEstimate)}
                  </div>

                  <div className="text-gray-600">
                    {task.startedAt && `Iniciado: ${new Date(task.startedAt).toLocaleTimeString('pt-BR')}`}
                  </div>

                  {task.completedAt && (
                    <div className="text-gray-600">
                      Concluído: {new Date(task.completedAt).toLocaleTimeString('pt-BR')}
                    </div>
                  )}

                  {task.error && (
                    <div className="text-red-600 font-medium">
                      Erro: {task.error.substring(0, 30)}...
                    </div>
                  )}
                </div>

                {task.syncStatus && Object.keys(task.syncStatus).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Sincronização Marketplace:</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(task.syncStatus).map(([channel, synced]) => (
                        <div
                          key={channel}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            synced
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {channel}: {synced ? '✓' : '○'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh toggle */}
      <div className="flex items-center justify-between text-sm border-t pt-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoRefresh"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="cursor-pointer"
          />
          <label htmlFor="autoRefresh" className="cursor-pointer text-gray-600">
            Auto-atualizar a cada 5 segundos
          </label>
        </div>
        <div className="text-gray-500">
          Última atualização: {tasks[0]?.lastUpdate ? new Date(tasks[0].lastUpdate).toLocaleTimeString('pt-BR') : 'Nunca'}
        </div>
      </div>
    </div>
  );
}
