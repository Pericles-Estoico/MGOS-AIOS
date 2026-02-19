/**
 * Component: MarketplaceApprovalPanel
 * Purpose: Admin dashboard panel for reviewing pending AI-generated task cards
 * Features:
 * - List pending AI tasks by channel
 * - Quick view of change details
 * - Batch approval workflow
 * - Filter by channel and priority
 */

'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { MarketplaceIntelBadge, ChannelTag, AITaskIndicator } from './marketplace-intel-badge';
import { AITaskApprovalModal } from './ai-task-approval-modal';

interface PendingTask {
  id: string;
  title: string;
  description: string;
  step_by_step: string;
  estimated_hours?: number;
  priority: string;
  channel: string;
  ai_change_type: string;
  ai_source_url?: string;
  ai_generated_at: string;
  created_at: string;
}

interface MarketplaceApprovalPanelProps {
  onTasksLoaded?: (count: number) => void;
}

export function MarketplaceApprovalPanel({
  onTasksLoaded,
}: MarketplaceApprovalPanelProps) {
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<PendingTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterChannel, setFilterChannel] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  // Fetch pending tasks
  const fetchPendingTasks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterChannel) params.append('channel', filterChannel);

      const response = await fetch(
        `/api/marketplace-intel/tasks?${params.toString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch tasks');

      const data = await response.json();
      let tasks = data.tasks || [];

      // Client-side filter by priority
      if (filterPriority) {
        tasks = tasks.filter((t: PendingTask) => t.priority === filterPriority);
      }

      setPendingTasks(tasks);
      onTasksLoaded?.(tasks.length);
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
      setPendingTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTasks();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingTasks, 30000);
    return () => clearInterval(interval);
  }, [filterChannel, filterPriority]);

  const handleApprove = async (
    taskId: string,
    assignedTo?: string,
    estimatedHours?: number
  ) => {
    try {
      const response = await fetch(
        `/api/marketplace-intel/approve/${taskId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assigned_to: assignedTo, estimated_hours: estimatedHours }),
        }
      );

      if (!response.ok) throw new Error('Approval failed');

      // Remove from list and refresh
      setPendingTasks(pendingTasks.filter((t) => t.id !== taskId));
      setIsModalOpen(false);
    } catch (error) {
      console.error('Approval error:', error);
      alert('Erro ao aprovar tarefa');
    }
  };

  const handleReject = async (taskId: string) => {
    try {
      const response = await fetch(
        `/api/marketplace-intel/approve/${taskId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Rejection failed');

      // Remove from list
      setPendingTasks(pendingTasks.filter((t) => t.id !== taskId));
      setIsModalOpen(false);
    } catch (error) {
      console.error('Rejection error:', error);
      alert('Erro ao rejeitar tarefa');
    }
  };

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      amazon: 'from-orange-600 to-orange-400',
      mercadolivre: 'from-blue-600 to-blue-400',
      shopee: 'from-red-600 to-red-400',
      shein: 'from-pink-600 to-pink-400',
      tiktokshop: 'from-purple-600 to-purple-400',
      kaway: 'from-emerald-600 to-emerald-400',
    };
    return colors[channel] || colors.amazon;
  };

  const changeTypeEmojis: Record<string, string> = {
    algorithm: '🔄',
    ads: '📢',
    content: '📝',
    policies: '⚖️',
    features: '✨',
  };

  if (pendingTasks.length === 0 && !isLoading) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
        <h3 className="text-lg font-semibold text-gray-900">Tudo em Dia! ✨</h3>
        <p className="text-sm text-gray-600 mt-1">
          Não há tarefas de inteligência aguardando aprovação
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            🤖 Tarefas de Inteligência Pendentes
            {pendingTasks.length > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {pendingTasks.length}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-600">
            {pendingTasks.length === 0
              ? 'Nenhuma tarefa aguardando revisão'
              : `${pendingTasks.length} mudança${pendingTasks.length !== 1 ? 's' : ''} detectada${pendingTasks.length !== 1 ? 's' : ''} para aprovar`}
          </p>
        </div>
        <button
          onClick={fetchPendingTasks}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 rounded-md transition disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCw
            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          disabled={isLoading}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os Canais</option>
          <option value="amazon">Amazon 📦</option>
          <option value="mercadolivre">MercadoLivre 🟦</option>
          <option value="shopee">Shopee 🏪</option>
          <option value="shein">Shein 👗</option>
          <option value="tiktokshop">TikTok Shop 🎵</option>
          <option value="kaway">Kaway 🎁</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          disabled={isLoading}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as Prioridades</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="mx-auto w-8 h-8 text-gray-400 animate-spin" />
          <p className="text-gray-600 text-sm mt-2">Carregando tarefas...</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              className="border rounded-lg hover:shadow-md transition cursor-pointer bg-white"
              onClick={() => {
                setSelectedTask(task);
                setIsModalOpen(true);
              }}
            >
              <div className="p-4">
                {/* Title & Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-gray-900 flex-1 line-clamp-2">
                    {task.title}
                  </h3>
                  <AITaskIndicator approved={false} />
                </div>

                {/* Description Preview */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {task.description}
                </p>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <ChannelTag channel={task.channel} size="sm" />

                  <span
                    className={`inline-block px-2 py-1 rounded font-medium ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {task.priority.toUpperCase()}
                  </span>

                  {task.ai_change_type && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
                      <span>
                        {changeTypeEmojis[task.ai_change_type] || '📋'}
                      </span>
                      {task.ai_change_type}
                    </span>
                  )}

                  {task.estimated_hours && (
                    <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 font-medium">
                      ⏱️ {task.estimated_hours}h
                    </span>
                  )}

                  <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs">
                    {new Date(task.ai_generated_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(task.id);
                  }}
                  className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition"
                  title="Rejeitar tarefa"
                >
                  <XCircle className="w-4 h-4 inline mr-1" />
                  Rejeitar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(task.id);
                  }}
                  className="px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded transition"
                  title="Aprovar rápido sem atribuição"
                >
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Aprovar Rápido
                </button>
                <span className="flex-1 text-right text-xs text-gray-500">
                  Clique para revisar completo →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedTask && (
        <AITaskApprovalModal
          isOpen={isModalOpen}
          task={selectedTask}
          users={[]} // Fetch from API in real implementation
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
