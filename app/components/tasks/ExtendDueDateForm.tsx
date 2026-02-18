'use client';

import { useState } from 'react';

interface ExtendDueDateFormProps {
  taskId: string;
  currentDueDate?: string;
  onSubmit?: (data: { due_date: string }) => void;
}

export default function ExtendDueDateForm({ taskId, currentDueDate, onSubmit }: ExtendDueDateFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newDueDate, setNewDueDate] = useState(currentDueDate || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!newDueDate) {
      setError('Please select a due date');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}/extend-due-date`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_date: newDueDate }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to extend due date');
        return;
      }

      setSuccess(true);
      onSubmit?.({ due_date: newDueDate });

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Due date extended successfully!
        </div>
      )}

      <div>
        <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 mb-2">
          New Due Date <span className="text-red-500">*</span>
        </label>
        <input
          id="due-date"
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Select a future date to extend the task deadline
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
      >
        {loading ? 'Extending...' : 'Extend Due Date'}
      </button>
    </form>
  );
}
