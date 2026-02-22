'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut,
  CheckCircle2,
  Plus,
  BarChart3,
  Users,
  ClipboardList,
  Settings,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const stats = [
    { label: 'Total de Tasks', value: '24', color: 'from-blue-400 to-blue-600' },
    { label: 'Completas', value: '8', color: 'from-green-400 to-green-600' },
    { label: 'Em Progresso', value: '10', color: 'from-cyan-400 to-cyan-600' },
    { label: 'Pendentes', value: '6', color: 'from-orange-400 to-orange-600' },
  ];

  const recentTasks = [
    { id: 1, title: 'Implementar autenticação', status: 'in-progress', priority: 'high', updatedAt: '18/02/2026' },
    { id: 2, title: 'Documentar API', status: 'in-progress', priority: 'medium', updatedAt: '18/02/2026' },
    { id: 3, title: 'Integrar Supabase', status: 'pending', priority: 'high', updatedAt: '18/02/2026' },
    { id: 4, title: 'Corrigir bugs de performance', status: 'approved', priority: 'high', updatedAt: '17/02/2026' },
  ];

  const quickActions = [
    {
      icon: Plus,
      label: 'Criar Task',
      description: 'Começar uma nova tarefa',
      color: 'from-blue-500 to-blue-600',
      href: '/tasks/new',
      button: '✨ Criar Task'
    },
    {
      icon: BarChart3,
      label: 'Ver Analytics',
      description: 'Analisar performance da equipe',
      color: 'from-purple-500 to-purple-600',
      href: '/analytics',
      button: '📊 Ver Analytics'
    },
    {
      icon: Users,
      label: 'Gerenciar Equipe',
      description: 'Gerenciar usuários e permissões',
      color: 'from-teal-500 to-teal-600',
      href: '/team',
      button: '👥 Gerenciar Equipe'
    },
  ];

  const statusColors = {
    'in-progress': { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Em Progresso' },
    'pending': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pendente' },
    'approved': { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprovada' },
    'completed': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Concluída' },
  };

  const priorityColors = {
    'high': { bg: 'bg-red-100', text: 'text-red-700', label: 'Alta' },
    'medium': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Média' },
    'low': { bg: 'bg-green-100', text: 'text-green-700', label: 'Baixa' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MGOS</h1>
            <p className="text-sm text-gray-600">Task Management</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-600">Você está logado como</p>
              <p className="font-semibold text-gray-900">{session?.user?.name || 'user'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Bem-vindo, {session?.user?.name || 'pericles'}! 👋</h2>
          <p className="text-gray-600">Gerencie suas tarefas e acompanhe o progresso do time</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
              >
                <div className={`bg-gradient-to-br ${action.color} rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transform hover:scale-105 transition h-full`}>
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-8 h-8" />
                    <ArrowRight className="w-5 h-5 opacity-75" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{action.label}</h3>
                  <p className="text-sm opacity-90 mb-4">{action.description}</p>
                  <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition">
                    {action.button}
                  </button>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Minhas Tasks</h3>
              <p className="text-sm text-gray-600">Últimas tarefas atualizadas</p>
            </div>
            <Link href="/tasks">
              <span className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer">
                Ver todas <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Prioridade</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTasks.map((task) => {
                  const status = statusColors[task.status as keyof typeof statusColors];
                  const priority = priorityColors[task.priority as keyof typeof priorityColors];

                  return (
                    <tr key={task.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <Link href={`/tasks/${task.id}`}>
                          <span className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                            {task.title}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priority.bg} ${priority.text}`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{task.updatedAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
