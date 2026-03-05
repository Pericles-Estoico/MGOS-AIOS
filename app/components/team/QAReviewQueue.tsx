'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PendingTask {
  id: string;
  title: string;
  submitted_at?: string;
  created_at: string;
}

interface QAReviewQueueProps {
  maxItems?: number;
  refreshInterval?: number;
}

export default function QAReviewQueue({
  maxItems = 5,
  refreshInterval = 60000,
}: QAReviewQueueProps) {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/tasks?status=submitted&limit=10');
      if (!res.ok) return;
      const data = await res.json();
      setTasks((data.data || []).slice(0, maxItems));
      setTotal(data.total || 0);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const daysSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Fila de Revisão QA</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {total} pendente{total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-500 text-sm">Carregando...</div>
      ) : tasks.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhuma tarefa aguardando revisão</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const submittedDate = task.submitted_at || task.created_at;
            const days = daysSince(submittedDate);
            return (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <Link
                  href={`/tasks/${task.id}`}
                  className="text-sm text-blue-600 hover:underline truncate max-w-[180px]"
                >
                  {task.title}
                </Link>
                <span className={`text-xs font-medium ml-2 whitespace-nowrap ${days >= 2 ? 'text-red-600' : 'text-gray-500'}`}>
                  {days === 0 ? 'hoje' : `${days}d atrás`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {total > maxItems && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <Link
            href="/qa-reviews"
            className="text-sm text-blue-600 hover:underline"
          >
            Ver todas as {total} tarefas →
          </Link>
        </div>
      )}

      {total > 0 && total <= maxItems && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <Link href="/qa-reviews" className="text-sm text-blue-600 hover:underline">
            Ir para Revisões QA →
          </Link>
        </div>
      )}
    </div>
  );
}
