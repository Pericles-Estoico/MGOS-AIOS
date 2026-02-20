'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Eye,
  ArrowLeft
} from 'lucide-react';

interface MarketplaceTask {
  id: string;
  marketplace: 'amazon' | 'shopee' | 'mercadolivre' | 'shein' | 'tiktokshop' | 'kaway';
  title: string;
  description: string;
  category: 'optimization' | 'best-practice' | 'scaling' | 'analysis';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'awaiting_approval' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  createdBy: string;
  estimatedHours: number;
  actualHours?: number;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
}

const MARKETPLACE_LABELS = {
  amazon: { name: 'Amazon', icon: '🛒', color: 'orange' },
  shopee: { name: 'Shopee', icon: '🏪', color: 'red' },
  mercadolivre: { name: 'MercadoLivre', icon: '🎯', color: 'yellow' },
  shein: { name: 'SHEIN', icon: '👗', color: 'pink' },
  tiktokshop: { name: 'TikTok Shop', icon: '📱', color: 'black' },
  kaway: { name: 'Kaway', icon: '💎', color: 'purple' },
};

const STATUS_LABELS = {
  pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-700' },
  awaiting_approval: { label: 'Aguardando Aprovação', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Aprovada', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Em Progresso', color: 'bg-cyan-100 text-cyan-700' },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejeitada', color: 'bg-red-100 text-red-700' },
};

const PRIORITY_LABELS = {
  high: { label: 'Alta', color: 'text-red-600' },
  medium: { label: 'Média', color: 'text-orange-600' },
  low: { label: 'Baixa', color: 'text-green-600' },
};

export default function MarketplaceTasksPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || 'awaiting_approval';

  const [tasks, setTasks] = useState<MarketplaceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (session && session.user.role && !['admin', 'head'].includes(session.user.role)) {
      router.push('/marketplace');
    }
  }, [session, router]);

  // Fetch tasks
  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        setError(null);

        const query = new URLSearchParams();
        if (statusFilter) query.append('status', statusFilter);

        const response = await fetch(`/api/orchestration/tasks?${query.toString()}`);
        if (!response.ok) throw new Error('Erro ao buscar tarefas');

        const data = await response.json();
        setTasks(data.tasks || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchTasks();
    }
  }, [session?.user, statusFilter]);

  const handleApprove = async (taskIds: string[]) => {
    try {
      const response = await fetch('/api/orchestration/tasks/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds,
          approved: true,
          reason: 'Aprovado via dashboard',
        }),
      });

      if (!response.ok) throw new Error('Erro ao aprovar tarefas');

      // Refresh tasks
      setTasks(tasks.filter((t) => !taskIds.includes(t.id)));
      setSelectedTasks([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  const handleReject = async (taskId: string) => {
    try {
      const response = await fetch('/api/orchestration/tasks/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds: [taskId],
          approved: false,
          reason: 'Rejeitado via dashboard',
        }),
      });

      if (!response.ok) throw new Error('Erro ao rejeitar tarefa');

      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Carregando tarefas do marketplace...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Tarefas do Marketplace</h1>
          <p className="text-gray-600">Gerenciar e aprovar tarefas dos agentes especializados</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
          <Link
            key={key}
            href={`/marketplace/tasks?status=${key}`}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-blue-700 font-medium">{selectedTasks.length} tarefa(s) selecionada(s)</p>
          <button
            onClick={() => handleApprove(selectedTasks)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            <CheckCircle2 className="w-4 h-4 inline mr-2" />
            Aprovar Selecionadas
          </button>
        </div>
      )}

      {/* Tasks Table */}
      {tasks.length === 0 ? (
        <div className="text-center bg-white rounded-lg shadow p-12">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma tarefa encontrada nesta categoria</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTasks.length === tasks.length}
                      onChange={(e) =>
                        setSelectedTasks(e.target.checked ? tasks.map((t) => t.id) : [])
                      }
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Canal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tarefa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Horas Est.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => {
                  const marketplace = MARKETPLACE_LABELS[task.marketplace];
                  const priorityInfo = PRIORITY_LABELS[task.priority];
                  const statusInfo = STATUS_LABELS[task.status];

                  return (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTasks([...selectedTasks, task.id]);
                            } else {
                              setSelectedTasks(selectedTasks.filter((id) => id !== task.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{marketplace.icon}</span>
                          <span className="font-medium text-gray-900">{marketplace.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 truncate">{task.title}</p>
                          <p className="text-sm text-gray-600 truncate">{task.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${priorityInfo.color}`}>{priorityInfo.label}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                        {task.estimatedHours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/marketplace/tasks/${task.id}`)}
                            className="text-blue-600 hover:text-blue-700 transition p-2"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {task.status === 'awaiting_approval' && (
                            <>
                              <button
                                onClick={() => handleApprove([task.id])}
                                className="text-green-600 hover:text-green-700 transition p-2"
                                title="Aprovar"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(task.id)}
                                className="text-red-600 hover:text-red-700 transition p-2"
                                title="Rejeitar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
