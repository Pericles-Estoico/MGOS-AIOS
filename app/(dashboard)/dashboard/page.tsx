import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const metadata = {
  title: 'Dashboard - Digital TaskOps',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Bem-vindo, {session?.user?.name || session?.user?.email}! 👋
        </h2>
        <p className="text-gray-600">
          Você está logado como <strong>{session?.user?.role}</strong>
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">0</div>
          <p className="text-gray-600 mt-2">Tasks Atribuídas</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">0</div>
          <p className="text-gray-600 mt-2">Completas</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-orange-600">0</div>
          <p className="text-gray-600 mt-2">Em Andamento</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Próximos Passos</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Acesse a aba <strong>Tasks</strong> para ver suas tarefas</li>
          <li>• Clique em uma tarefa para visualizar detalhes</li>
          {session?.user?.role && ['admin', 'head'].includes(session.user.role) && (
            <li>• Acesse <strong>Team Dashboard</strong> para gerenciar a equipe</li>
          )}
        </ul>
      </div>
    </div>
  );
}
