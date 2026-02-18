'use client';

import { FormEvent, useState } from 'react';
import { isValidDuration } from '@/utils/time-utils';

interface TimeLogFormProps {
  taskId: string;
  durationMinutes?: number;
  onSubmit?: (data: { duration_minutes: number; description?: string; logged_date?: string }) => void;
}

export default function TimeLogForm({ taskId, durationMinutes, onSubmit }: TimeLogFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const duration = durationMinutes || parseInt(formData.get('duration_minutes') as string, 10);

    if (!duration || !isValidDuration(duration)) {
      setError('Duration must be between 1 and 1440 minutes');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/time-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          duration_minutes: duration,
          description: formData.get('description'),
          logged_date: formData.get('logged_date') || new Date().toISOString().split('T')[0],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to log time');
        return;
      }

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      onSubmit?.({
        duration_minutes: duration,
        description: formData.get('description') as string,
      });

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
          Time logged successfully!
        </div>
      )}

      {!durationMinutes && (
        <div>
          <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes) <span className="text-red-500">*</span>
          </label>
          <input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min="1"
            max="1440"
            required
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 90"
          />
          <p className="text-xs text-gray-500 mt-1">Enter time spent working on this task (1-1440 minutes)</p>
        </div>
      )}

      {durationMinutes && (
        <div className="bg-green-50 border border-green-300 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-green-600 uppercase font-semibold">Time from Timer</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{durationMinutes} min</p>
            </div>
            <div className="text-4xl">⏱️</div>
          </div>
          <p className="text-xs text-green-700 mt-2">Calculated from: {Math.floor(durationMinutes * 60)} seconds</p>
        </div>
      )}

      <div>
        <label htmlFor="logged_date" className="block text-sm font-medium text-gray-700 mb-2">
          Date
        </label>
        <input
          id="logged_date"
          name="logged_date"
          type="date"
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          defaultValue={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="What did you work on?"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
      >
        {loading ? 'Saving...' : 'Log Time'}
      </button>
    </form>
  );
}
