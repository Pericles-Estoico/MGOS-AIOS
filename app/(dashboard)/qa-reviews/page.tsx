'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  assigned_to?: string;
  created_at: string;
  evidence?: Array<{
    created_at: string;
  }>;
}

const priorityColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
};

export default function QAReviewsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Redirect if not QA role
  useEffect(() => {
    if (session && session.user.role !== 'qa') {
      router.push('/dashboard');
    }
  }, [session, router]);

  useEffect(() => {
    if (!session) return;

    async function fetchTasks() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/tasks?status=submitted&offset=${page * 20}&limit=20`
        );

        if (!res.ok) {
          setError('Failed to load tasks');
          return;
        }

        const data = await res.json();
        setTasks(data.data || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [session, page]);

  if (loading) {
    return <div className="text-center py-12">Loading tasks...</div>;
  }

  return (
    <div>
      <Link href="/dashboard" className="text-blue-600 hover:underline mb-6 block">
        ← Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">QA Reviews</h1>
        <p className="text-gray-600">
          {total} task{total !== 1 ? 's' : ''} waiting for review
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No tasks pending review</p>
          <p className="text-sm text-gray-400 mt-2">
            Check back when executors submit evidence
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-blue-300 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                  {task.title}
                </h3>
                <span
                  className={`text-sm font-medium ${
                    priorityColors[task.priority as keyof typeof priorityColors]
                  }`}
                >
                  {task.priority} priority
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  📎 Evidence submitted:{' '}
                  {task.evidence?.length ? `${task.evidence.length} file(s)` : 'None yet'}
                </span>
                <span>
                  📅{' '}
                  {new Date(task.evidence?.[0]?.created_at || task.created_at).toLocaleDateString(
                    'pt-BR'
                  )}
                </span>
              </div>

              <div className="mt-2 inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                Pending Review
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="px-4 py-2">
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
  );
}
