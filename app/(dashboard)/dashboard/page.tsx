'use client';

import { useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  BarChart2,
  Users,
  CheckCircle2,
  Clock3,
  Circle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { MarketplaceApprovalPanel } from '@/components/marketplace-approval-panel';

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

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  aprovado:   { label: 'Aprovado',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',   dot: 'bg-emerald-500' },
  concluido:  { label: 'Concluido',   color: 'text-green-700 bg-green-50 border-green-200',         dot: 'bg-green-500' },
  fazendo:    { label: 'Fazendo',     color: 'text-blue-700 bg-blue-50 border-blue-200',            dot: 'bg-blue-500' },
  enviado_qa: { label: 'Em QA',       color: 'text-yellow-700 bg-yellow-50 border-yellow-200',      dot: 'bg-yellow-500' },
  a_fazer:    { label: 'A Fazer',     color: 'text-zinc-600 bg-zinc-50 border-zinc-200',            dot: 'bg-zinc-400' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  high:   { label: 'Alta',   color: 'text-red-600 bg-red-50 border-red-200' },
  medium: { label: 'Media',  color: 'text-orange-600 bg-orange-50 border-orange-200' },
  low:    { label: 'Baixa',  color: 'text-green-600 bg-green-50 border-green-200' },
};

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
      await fetchUserDashboard(userSession.user?.id || '');
    };
    checkAuth();
  }, [router]);

  const fetchUserDashboard = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const [tasksRes, allTasksRes] = await Promise.all([
        fetch(`/api/tasks?assigned_to=${userId}&limit=5&sort_by=updated_at`),
        fetch(`/api/tasks?assigned_to=${userId}`),
      ]);

      if (!tasksRes.ok) throw new Error('Falha ao carregar tarefas');

      const tasksData = await tasksRes.json();
      setMyTasks(tasksData.data || []);

      if (allTasksRes.ok) {
        const allTasksData = await allTasksRes.json();
        const all = allTasksData.data || [];
        setStats({
          total_tasks: all.length,
          completed_tasks: all.filter((t: Task) => t.status === 'aprovado' || t.status === 'concluido').length,
          in_progress_tasks: all.filter((t: Task) => t.status === 'fazendo' || t.status === 'enviado_qa').length,
          pending_tasks: all.filter((t: Task) => t.status === 'a_fazer').length,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-zinc-200 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-zinc-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 border border-red-200 rounded-xl bg-red-50">
        <p className="font-semibold text-red-700 text-sm">Erro ao carregar dashboard</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  const userName = session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
          Bom dia, {userName}
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Aqui esta o resumo das suas atividades
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total"
          value={stats.total_tasks}
          icon={<Circle className="w-4 h-4" />}
          iconColor="text-zinc-400"
          trend={null}
        />
        <StatCard
          label="Concluidas"
          value={stats.completed_tasks}
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconColor="text-emerald-500"
          trend={stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0}
        />
        <StatCard
          label="Em progresso"
          value={stats.in_progress_tasks}
          icon={<Clock3 className="w-4 h-4" />}
          iconColor="text-blue-500"
          trend={null}
        />
        <StatCard
          label="Pendentes"
          value={stats.pending_tasks}
          icon={<TrendingUp className="w-4 h-4" />}
          iconColor="text-orange-500"
          trend={null}
        />
      </div>

      {/* My Tasks */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Minhas Tarefas</h2>
          <Link
            href="/tasks"
            className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            Ver todas
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {myTasks.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-zinc-400">Nenhuma tarefa atribuida no momento</p>
            <Link
              href="/tasks/new"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Criar primeira tarefa
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {myTasks.map((task) => {
              const statusInfo = STATUS_MAP[task.status] || STATUS_MAP['a_fazer'];
              const priorityInfo = PRIORITY_MAP[task.priority?.toLowerCase()] || null;
              return (
                <div
                  key={task.id}
                  className="px-5 py-3.5 hover:bg-zinc-50 cursor-pointer transition-colors flex items-center gap-4"
                  onClick={() => router.push(`/tasks/${task.id}`)}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusInfo.dot}`} />
                  <p className="flex-1 text-sm font-medium text-zinc-800 truncate">{task.title}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {priorityInfo && (
                      <span className={`hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="hidden md:block text-xs text-zinc-400">
                      {new Date(task.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Marketplace Approval (admin only) */}
      {session?.user?.role === 'admin' && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Aprovacoes Marketplace</h2>
          </div>
          <div className="p-5">
            <MarketplaceApprovalPanel />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickAction
          label="Criar Tarefa"
          description="Iniciar nova tarefa"
          icon={<Plus className="w-4 h-4" />}
          href="/tasks/new"
        />
        <QuickAction
          label="Ver Analytics"
          description="Performance da equipe"
          icon={<BarChart2 className="w-4 h-4" />}
          href={session?.user?.role && ['admin', 'head'].includes(session.user.role) ? '/analytics' : '/dashboard'}
        />
        <QuickAction
          label="Gerenciar Equipe"
          description="Usuarios e permissoes"
          icon={<Users className="w-4 h-4" />}
          href={session?.user?.role === 'admin' ? '/settings/users' : '/dashboard'}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconColor: string;
  trend: number | null;
}

function StatCard({ label, value, icon, iconColor, trend }: StatCardProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        <span className={iconColor}>{icon}</span>
      </div>
      <p className="text-2xl font-semibold text-zinc-900 tracking-tight">{value}</p>
      {trend !== null && (
        <p className="text-xs text-zinc-400 mt-1">{trend}% do total</p>
      )}
    </div>
  );
}

interface QuickActionProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function QuickAction({ label, description, icon, href }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer group">
        <div className="w-7 h-7 bg-zinc-100 group-hover:bg-teal-50 rounded-lg flex items-center justify-center mb-3 transition-colors">
          <span className="text-zinc-500 group-hover:text-teal-600 transition-colors">{icon}</span>
        </div>
        <p className="text-sm font-semibold text-zinc-800">{label}</p>
        <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
      </div>
    </Link>
  );
}
