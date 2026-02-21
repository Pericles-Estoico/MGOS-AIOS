'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BurndownChart from '@/components/tasks/BurndownChart';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  status_history?: Array<{
    id: string;
    operation: string;
    old_value?: Record<string, unknown>;
    new_value?: Record<string, unknown>;
    created_by?: string;
    created_at: string;
  }>;
}

interface TaskStats {
  pending: number;
  in_progress: number;
  submitted: number;
  qa_review: number;
  approved: number;
  rejected: number;
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

export default function TeamPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]); // For burndown chart
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Redirect if not admin/head
  useEffect(() => {
    if (session && session.user.role && !['admin', 'head'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [session, router]);

  useEffect(() => {
    if (!session) return;

    async function fetchData() {
      try {
        setLoading(true);

        // Fetch paginated tasks for table
        const statusQuery = statusFilter === 'all' ? '' : `&status=${statusFilter}`;
        const res = await fetch(
          `/api/tasks?offset=${page * 20}&limit=20${statusQuery}`
        );

        if (!res.ok) {
          setError('Failed to load tasks');
          return;
        }

        const data = await res.json();
        setTasks(data.data || []);
        setTotal(data.total || 0);

        // Fetch ALL tasks for burndown chart (no pagination)
        const allRes = await fetch('/api/tasks?limit=1000');
        if (allRes.ok) {
          const allData = await allRes.json();
          setAllTasks(allData.data || []);
        }

        // Calculate stats
        if (data.data) {
          const newStats: TaskStats = {
            pending: 0,
            in_progress: 0,
            submitted: 0,
            qa_review: 0,
            approved: 0,
            rejected: 0,
          };

          data.data.forEach((task: Task) => {
            if (task.status in newStats) {
              newStats[task.status as keyof TaskStats]++;
            }
          });

          setStats(newStats);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session, page, statusFilter]);

  if (loading) {
    return <div className="text-center py-12">Loading team data...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard do Time</h1>
          <p className="text-gray-600 mt-1">{total} tarefas no total</p>
        </div>
        <Link
          href="/qa-reviews"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Ver Fila de QA →
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Status Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {Object.entries(stats).map(([status, count]) => (
            <div
              key={status}
              className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                statusFilter === status ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
              onClick={() => {
                setStatusFilter(status);
                setPage(0);
              }}
            >
              <div className="text-sm font-medium text-gray-600 mb-1 capitalize">{status}</div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-500 mt-1">
                {total > 0 ? Math.round((count / total) * 100) : 0}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Burndown Chart */}
      {allTasks.length > 0 && (
        <div className="mb-8">
          <BurndownChart tasks={allTasks} />
        </div>
      )}

      {/* Task List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {statusFilter === 'all' ? 'Todas as Tarefas' : `Tarefas: ${statusFilter}`}
          </h2>
          {statusFilter !== 'all' && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPage(0);
              }}
              className="text-sm text-blue-600 hover:underline mt-2"
            >
              Clear filter
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No tasks found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Task</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {task.assigned_to || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          priorityColors[task.priority as keyof typeof priorityColors]
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          statusColors[task.status as keyof typeof statusColors]
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="p-4 border-t border-gray-200 flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
            >
              ← Previous
            </button>
            <span className="px-4 py-2 text-sm">
              Page {page + 1} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * 20 >= total}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
