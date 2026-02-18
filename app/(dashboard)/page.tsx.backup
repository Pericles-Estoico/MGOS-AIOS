'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, Settings, Search, Bell, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';
import { useState } from 'react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const tasks = [
    {
      id: 1,
      title: 'Implementar autenticação',
      status: 'in-progress',
      priority: 'high',
      assignee: '@john',
      dueDate: 'Feb 25',
    },
    {
      id: 2,
      title: 'Criar design system',
      status: 'pending',
      priority: 'medium',
      assignee: '@uma',
      dueDate: 'Feb 22',
    },
    {
      id: 3,
      title: 'Corrigir bugs de performance',
      status: 'review',
      priority: 'urgent',
      assignee: '@dex',
      dueDate: 'Feb 20',
    },
  ];

  const stats = [
    { label: 'Tarefas Pendentes', value: '12', icon: Clock, color: 'from-orange-400 to-orange-600' },
    { label: 'Em Progresso', value: '5', icon: Zap, color: 'from-cyan-400 to-cyan-600' },
    { label: 'Concluídas', value: '18', icon: CheckCircle2, color: 'from-teal-400 to-teal-600' },
    { label: 'Em Revisão', value: '3', icon: AlertCircle, color: 'from-purple-400 to-purple-600' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      case 'in-progress':
        return 'bg-cyan-100 text-cyan-700';
      case 'review':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-teal-100 text-teal-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  MGOS-AIOS
                </h1>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar tarefas..."
                className="bg-transparent outline-none text-sm text-gray-700 placeholder-gray-500 w-40"
              />
            </div>

            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
              <Bell className="w-6 h-6 text-gray-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button
              onClick={() => router.push('/settings')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Settings className="w-6 h-6 text-gray-700" />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{session?.user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:translate-x-0 z-30 lg:z-0 mt-16 lg:mt-0`}>
          <div className="p-6 space-y-2">
            <nav className="space-y-2">
              {[
                { label: 'Dashboard', icon: '📊' },
                { label: 'Minhas Tarefas', icon: '✓' },
                { label: 'Team', icon: '👥' },
                { label: 'Relatórios', icon: '📈' },
                { label: 'Configurações', icon: '⚙️' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-cyan-50 text-gray-700 hover:text-cyan-600 transition font-medium"
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo, {session?.user?.name || 'Admin'}! 👋
            </h2>
            <p className="text-gray-600">Você tem 12 tarefas pendentes hoje</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`bg-gradient-to-br ${stat.color} p-4 rounded-xl`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tasks Section */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Tarefas Recentes</h3>
            </div>

            <div className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-6 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => router.push(`/tasks/${task.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Story {task.id}</span>
                        <span>•</span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status === 'pending' && 'Pendente'}
                          {task.status === 'in-progress' && 'Em Progresso'}
                          {task.status === 'review' && 'Em Revisão'}
                          {task.status === 'completed' && 'Concluída'}
                        </span>
                        <span>•</span>
                        <span>{task.assignee}</span>
                        <span>•</span>
                        <span>{task.dueDate}</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <span className="text-xl">→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
              <button className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm">
                Ver Todas as Tarefas →
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
