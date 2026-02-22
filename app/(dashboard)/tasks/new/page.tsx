'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function NewTaskPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restrict access
  if (session && session.user.role && !['admin', 'head'].includes(session.user.role)) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
        <p className="text-red-700">Você não tem permissão para criar tarefas</p>
        <Link href="/tasks" className="text-red-600 hover:underline mt-2 block">
          ← Voltar para Tarefas
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description'),
          priority: formData.get('priority'),
          due_date: formData.get('due_date') || null,
          assigned_to: formData.get('assigned_to') || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao criar tarefa');
        return;
      }

      router.push('/tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link href="/tasks" className="text-blue-600 hover:underline mb-6 block">
        ← Voltar para Tarefas
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Criar Nova Tarefa</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            ❌ Erro: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Título da tarefa"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Descrição da tarefa e critérios de aceitação"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade <span className="text-red-500">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione a prioridade</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Vencimento
              </label>
              <input
                id="due_date"
                name="due_date"
                type="date"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-2">
              Atribuir Para (ID do Usuário)
            </label>
            <input
              id="assigned_to"
              name="assigned_to"
              type="text"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="UUID do usuário (opcional)"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Criando...' : '✅ Criar Tarefa'}
            </button>

            <Link
              href="/tasks"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
