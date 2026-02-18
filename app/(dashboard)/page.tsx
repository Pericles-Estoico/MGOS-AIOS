'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogOut, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const stats = [
    { label: 'Tarefas Pendentes', value: '12', color: 'from-orange-400 to-orange-600' },
    { label: 'Em Progresso', value: '5', color: 'from-cyan-400 to-cyan-600' },
    { label: 'Concluídas', value: '18', color: 'from-teal-400 to-teal-600' },
    { label: 'Em Revisão', value: '3', color: 'from-purple-400 to-purple-600' },
  ];

  const tasks = [
    { id: 1, title: 'Implementar autenticação', status: 'em-andamento', priority: 'alta', statusLabel: 'Em Andamento', priorityLabel: 'Alta' },
    { id: 2, title: 'Criar design system', status: 'pendente', priority: 'média', statusLabel: 'Pendente', priorityLabel: 'Média' },
    { id: 3, title: 'Corrigir bugs de performance', status: 'revisão', priority: 'urgente', statusLabel: 'Em Revisão', priorityLabel: 'Urgente' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
            MGOS-AIOS
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Bem-vindo! 👋</h2>
          <p className="text-gray-600">Dashboard do MGOS-AIOS - Gerenciamento Inteligente de Tarefas</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Tarefas Recentes</h3>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-semibold text-gray-900">{task.title}</p>
                  <p className="text-sm text-gray-600">ID: {task.id}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    task.status === 'em-andamento' ? 'bg-cyan-100 text-cyan-700' :
                    task.status === 'pendente' ? 'bg-orange-100 text-orange-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {task.statusLabel}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    task.priority === 'urgente' ? 'bg-red-100 text-red-700' :
                    task.priority === 'alta' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {task.priorityLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
