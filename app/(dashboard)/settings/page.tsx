import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const metadata = {
  title: 'Settings - Digital TaskOps',
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Perfil do Usuário</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input
              type="text"
              value={session?.user?.name || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <input
              type="text"
              value={session?.user?.role || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div className="pt-4">
            <button
              disabled
              className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
            >
              Salvar (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
