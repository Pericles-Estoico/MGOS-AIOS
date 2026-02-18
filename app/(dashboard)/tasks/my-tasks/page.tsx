'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'qa_review' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  assigned_to?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
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
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  qa_review: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const priorityColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
};

export default function MyTasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const limit = 20;
  const totalPages = Math.ceil(totalTasks / limit);

  useEffect(() => {
    async function fetchMyTasks() {
      try {
        setLoading(true);
        setError(null);

        // Fetch only tasks assigned to current user
        const res = await fetch(
          `/api/tasks?offset=${page * limit}&limit=${limit}&assigned_to=${session?.user?.id}`
        );

        if (!res.ok) {
          if (res.status === 401) {
            setError('Você precisa estar autenticado');
            return;
          }
          throw new Error('Erro ao buscar minhas tarefas');
        }

        const json: TasksResponse = await res.json();
        setTasks(json.data);
        setTotalTasks(json.pagination.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchMyTasks();
    }
  }, [page, session?.user?.id]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Minhas Tarefas</h1>
        <p className="text-gray-600 mt-2">Tarefas atribuídas a você</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 h-16 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          Nenhuma tarefa atribuída a você no momento.
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
                    {task.description && (
                      <p className="text-gray-600 text-sm mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex gap-2 items-center mt-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          statusColors[task.status as keyof typeof statusColors] ||
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {task.status}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          priorityColors[task.priority as keyof typeof priorityColors]
                        }`}
                      >
                        {task.priority} prioridade
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {task.due_date && (
                      <p className="text-sm text-gray-600">
                        Vence:{' '}
                        <strong>
                          {new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </strong>
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <p className="text-gray-600 text-sm">
              Total: {totalTasks} tarefa{totalTasks !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <span className="px-3 py-2">
                Página {page + 1} de {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
