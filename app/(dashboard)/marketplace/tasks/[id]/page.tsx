'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Calendar,
  FileText,
  Zap,
  Flag,
} from 'lucide-react';

interface Task {
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
  assignedTo?: string;
  notes?: string;
  agentRecommendation?: string;
}

const MARKETPLACE_CONFIG = {
  amazon: { name: 'Amazon', icon: '🛒', color: 'from-orange-400 to-orange-600' },
  shopee: { name: 'Shopee', icon: '🏪', color: 'from-red-400 to-red-600' },
  mercadolivre: { name: 'MercadoLivre', icon: '🎯', color: 'from-yellow-400 to-yellow-600' },
  shein: { name: 'SHEIN', icon: '👗', color: 'from-pink-400 to-pink-600' },
  tiktokshop: { name: 'TikTok Shop', icon: '📱', color: 'from-black to-gray-700' },
  kaway: { name: 'Kaway', icon: '💎', color: 'from-purple-400 to-purple-600' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-700', icon: Clock },
  awaiting_approval: { label: 'Aguardando Aprovação', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  approved: { label: 'Aprovada', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  in_progress: { label: 'Em Progresso', color: 'bg-cyan-100 text-cyan-700', icon: Zap },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rejeitada', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const PRIORITY_CONFIG = {
  high: { label: 'Alta', color: 'text-red-600' },
  medium: { label: 'Média', color: 'text-orange-600' },
  low: { label: 'Baixa', color: 'text-green-600' },
};

export default function TaskDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params?.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (session && session.user.role && !['admin', 'head'].includes(session.user.role)) {
      router.push('/marketplace');
    }
  }, [session, router]);

  // Fetch task details
  useEffect(() => {
    async function fetchTask() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/marketplace/tasks/${taskId}`);

        if (!response.ok) {
          throw new Error('Falha ao carregar tarefa');
        }

        const { data } = await response.json();
        setTask(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    if (taskId && session?.user) {
      fetchTask();
    }
  }, [taskId, session?.user]);

  const handleApproveTask = async () => {
    if (!task) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/marketplace/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          notes: 'Aprovada pelo usuário'
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao aprovar tarefa');
      }

      setTask({ ...task, status: 'approved', approvedAt: new Date().toISOString() });
      alert('✅ Tarefa aprovada com sucesso!');
    } catch (err) {
      alert(`❌ Erro ao aprovar tarefa: ${err}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectTask = async () => {
    if (!task) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/marketplace/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          notes: 'Rejeitada pelo usuário'
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao rejeitar tarefa');
      }

      setTask({ ...task, status: 'rejected' });
      alert('❌ Tarefa rejeitada');
    } catch (err) {
      alert(`❌ Erro ao rejeitar tarefa: ${err}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Carregando detalhes da tarefa...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 font-medium">Tarefa não encontrada</p>
        <Link href="/marketplace/tasks" className="text-blue-600 hover:underline mt-4">
          Voltar para tarefas
        </Link>
      </div>
    );
  }

  const marketplaceConfig = MARKETPLACE_CONFIG[task.marketplace];
  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/marketplace/tasks" className="text-blue-600 hover:text-blue-700">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
          <p className="text-gray-600 mt-1">Tarefa #{task.id}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Marketplace & Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{marketplaceConfig.icon}</span>
                <div>
                  <p className="text-sm text-gray-600">Marketplace</p>
                  <p className="text-xl font-bold text-gray-900">{marketplaceConfig.name}</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full ${statusConfig.color}`}>
                {statusConfig.label}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Prioridade</p>
                <p className={`text-lg font-bold ${priorityConfig.color}`}>
                  {priorityConfig.label}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Categoria</p>
                <p className="text-lg font-bold text-gray-900">{task.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Horas Estimadas</p>
                <p className="text-lg font-bold text-gray-900">{task.estimatedHours}h</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Descrição
            </h3>
            <p className="text-gray-700 leading-relaxed">{task.description}</p>
          </div>

          {/* Agent Recommendation */}
          {task.agentRecommendation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Recomendação do Agente
              </h3>
              <p className="text-blue-800">{task.agentRecommendation}</p>
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Notas</h3>
              <p className="text-gray-700">{task.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Criada em</p>
                <p className="text-gray-900">
                  {new Date(task.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>

              {task.approvedAt && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Aprovada em</p>
                  <p className="text-gray-900">
                    {new Date(task.approvedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}

              {task.completedAt && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Concluída em</p>
                  <p className="text-gray-900">
                    {new Date(task.completedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Created By */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Criada por
            </h3>
            <p className="text-gray-900 font-medium">{task.createdBy}</p>
            <p className="text-sm text-gray-600 mt-1">Agente Especializado</p>
          </div>

          {/* Actions */}
          {task.status === 'awaiting_approval' && (
            <div className="bg-white rounded-lg shadow p-6 space-y-3">
              <button
                onClick={handleApproveTask}
                disabled={isUpdating}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
              >
                {isUpdating ? 'Processando...' : '✅ Aprovar'}
              </button>
              <button
                onClick={handleRejectTask}
                disabled={isUpdating}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
              >
                {isUpdating ? 'Processando...' : '❌ Rejeitar'}
              </button>
            </div>
          )}

          {task.status !== 'awaiting_approval' && (
            <div className={`p-4 rounded-lg ${statusConfig.color}`}>
              <p className="font-medium">
                Status: <span className="font-bold">{statusConfig.label}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
