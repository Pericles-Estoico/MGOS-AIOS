'use client';

import { useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { MarketplaceApprovalPanel } from '@/app/components/marketplace-approval-panel';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_tasks: 0,
    completed_tasks: 0,
    in_progress_tasks: 0,
    pending_tasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const userSession = await getSession();

      if (!userSession) {
        router.push('/login');
        return;
      }

      setSession(userSession);
      await fetchUserDashboard(userSession.user?.id);
    };

    checkAuth();
  }, [router]);

  const fetchUserDashboard = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const tasksRes = await fetch(
        `/api/tasks?assigned_to=${userId}&limit=5&sort_by=updated_at`
      );
      if (!tasksRes.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const tasksData = await tasksRes.json();
      const tasks = tasksData.data || [];
      setMyTasks(tasks);

      // Calculate stats
      const allTasksRes = await fetch(`/api/tasks?assigned_to=${userId}`);
      if (allTasksRes.ok) {
        const allTasksData = await allTasksRes.json();
        const allTasks = allTasksData.data || [];

        const statsData = {
          total_tasks: allTasks.length,
          completed_tasks: allTasks.filter((t: Task) => t.status === 'approved')
            .length,
          in_progress_tasks: allTasks.filter(
            (t: Task) => t.status === 'in_progress'
          ).length,
          pending_tasks: allTasks.filter((t: Task) => t.status === 'pending')
            .length,
        };

        setStats(statsData);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qa_review':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50">
        <p className="font-semibold text-red-600">Error loading dashboard</p>
        <p className="text-sm text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {session?.user?.name || session?.user?.email}!
        </h1>
        <p className="text-gray-600 mt-2">
          Você está logado como{' '}
          <span className="font-semibold capitalize">{session?.user?.role}</span>
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Tasks"
          value={stats.total_tasks}
          color="bg-teal-50 border-teal-200"
          textColor="text-teal-600"
        />
        <StatCard
          title="Completas"
          value={stats.completed_tasks}
          color="bg-emerald-50 border-emerald-200"
          textColor="text-emerald-600"
        />
        <StatCard
          title="Em Progresso"
          value={stats.in_progress_tasks}
          color="bg-cyan-50 border-cyan-200"
          textColor="text-cyan-600"
        />
        <StatCard
          title="Pendentes"
          value={stats.pending_tasks}
          color="bg-gray-50 border-gray-200"
          textColor="text-gray-600"
        />
      </div>

      {/* My Tasks Section */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Minhas Tasks</h2>
            <Link
              href="/tasks"
              className="text-teal-600 hover:text-teal-800 text-sm font-semibold"
            >
              Ver todas →
            </Link>
          </div>
        </div>

        {myTasks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nenhuma tarefa atribuída no momento
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Atualizado
                  </th>
                </tr>
              </thead>
              <tbody>
                {myTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                  >
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {task.title}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(task.updated_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Marketplace Intelligence Panel (Admin Only) */}
      {session?.user?.role === 'admin' && (
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b">
            <MarketplaceApprovalPanel />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          title="Criar Task"
          description="Começar uma nova tarefa"
          icon={<Plus className="w-6 h-6" />}
          href="/tasks/new"
          color="bg-teal-50 border-teal-200"
        />
        <ActionCard
          title="Ver Analytics"
          description="Analisar performance da equipe"
          icon={<BarChart3 className="w-6 h-6" />}
          href={
            session?.user?.role && ['admin', 'head'].includes(session.user.role)
              ? '/analytics'
              : '/dashboard'
          }
          color="bg-cyan-50 border-cyan-200"
        />
        <ActionCard
          title="Gerenciar Equipe"
          description="Gerenciar usuários e permissões"
          icon={<Users className="w-6 h-6" />}
          href={
            session?.user?.role === 'admin'
              ? '/settings/users'
              : '/dashboard'
          }
          color="bg-emerald-50 border-emerald-200"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: string;
  textColor: string;
}

function StatCard({ title, value, color, textColor }: StatCardProps) {
  return (
    <div className={`p-6 border rounded-lg ${color}`}>
      <p className="text-gray-600 text-sm font-semibold">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${textColor}`}>{value}</p>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

function ActionCard({
  title,
  description,
  icon,
  href,
  color,
}: ActionCardProps) {
  return (
    <Link href={href}>
      <div
        className={`p-6 border rounded-lg ${color} hover:shadow-md transition-shadow cursor-pointer`}
      >
        <div className="text-teal-600 mb-3">{icon}</div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </Link>
  );
}
