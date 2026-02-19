'use client';

import { useState } from 'react';

interface TaskReassignFormProps {
  taskId: string;
  currentAssignee?: string;
  onSubmit?: (data: { assigned_to: string }) => void;
}

export default function TaskReassignForm({ taskId, currentAssignee, onSubmit }: TaskReassignFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newAssignee, setNewAssignee] = useState(currentAssignee || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!newAssignee) {
      setError('Please select a team member');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: newAssignee }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to reassign task');
        return;
      }

      setSuccess(true);
      onSubmit?.({ assigned_to: newAssignee });

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
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded">
          Task reassigned successfully!
        </div>
      )}

      <div>
        <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-2">
          Assign to <span className="text-red-500">*</span>
        </label>
        <input
          id="assignee"
          type="text"
          value={newAssignee}
          onChange={(e) => setNewAssignee(e.target.value)}
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          placeholder="Team member name or ID"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter the name or ID of the team member to assign this task to
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition"
      >
        {loading ? 'Assigning...' : 'Reassign Task'}
      </button>
    </form>
  );
}
