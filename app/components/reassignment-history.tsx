'use client';

import { useEffect, useState } from 'react';

interface ReassignmentEntry {
  id: string;
  old_assignee_id: string;
  new_assignee_id: string;
  old_assignee_name: string;
  new_assignee_name: string;
  reason: string | null;
  reassigned_by: string;
  reassigned_by_name: string;
  created_at: string;
}

interface ReassignmentHistoryProps {
  taskId: string;
}

export function ReassignmentHistory({ taskId }: ReassignmentHistoryProps) {
  const [history, setHistory] = useState<ReassignmentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [taskId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/tasks/${taskId}/reassignment-history`
      );

      if (res.ok) {
        const data = await res.json();
        setHistory(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching reassignment history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        Nenhuma reatribuição registrada
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <div
          key={entry.id}
          className="p-4 border rounded-lg bg-gray-50 hover:bg-white transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-900">
              {entry.old_assignee_name}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-sm font-semibold text-gray-900">
              {entry.new_assignee_name}
            </span>
            <span className="text-xs text-gray-500">
              por {entry.reassigned_by_name}
            </span>
          </div>

          <div className="text-xs text-gray-500 mb-2">
            {new Date(entry.created_at).toLocaleString('pt-BR')}
          </div>

          {entry.reason && (
            <div className="text-sm text-gray-600 border-l-2 border-blue-300 pl-3 italic">
              &quot;{entry.reason}&quot;
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
