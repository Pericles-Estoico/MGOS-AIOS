'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  assigned_to?: string;
  created_by?: string;
  created_at: string;
}

interface TasksResponse {
  data: Task[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-cyan-100 text-cyan-700',
  completed: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-red-100 text-red-700',
};

const priorityColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
};

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/tasks?offset=${page * limit}&limit=${limit}`);

        if (!res.ok) {
          if (res.status === 401) {
            setError('Você precisa estar autenticado');
            return;
          }
          throw new Error('Erro ao buscar tarefas');
        }

        const json: TasksResponse = await res.json();
        setTasks(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [page]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tarefas</h1>
        {session?.user?.role && ['admin', 'head'].includes(session.user.role) && (
          <Link
            href="/tasks/new"
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">Nenhuma tarefa encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition p-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-teal-600 transition-colors">
                    {task.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">{task.description}</p>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[task.status]}`}>
                      {task.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                        {new Date(task.due_date).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && tasks.length > 0 && (
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← Anterior
          </button>

          <span className="text-gray-600">
            Página {page + 1}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
