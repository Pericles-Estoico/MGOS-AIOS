'use client';

import { FormEvent, useState } from 'react';

interface QAReviewFormProps {
  taskId: string;
  onSubmit?: (data: { status: string; feedback?: string }) => void;
}

export default function QAReviewForm({ taskId, onSubmit }: QAReviewFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/qa-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          status: formData.get('status'),
          feedback: formData.get('feedback'),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit review');
        return;
      }

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      onSubmit?.({
        status: formData.get('status') as string,
        feedback: formData.get('feedback') as string,
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
          QA review submitted successfully!
        </div>
      )}

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
          Status <span>*</span>
        </label>
        <select
          id="status"
          name="status"
          required
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select status</option>
          <option value="approved">✓ Approved</option>
          <option value="rejected">✗ Rejected</option>
          <option value="changes_requested">! Changes Requested</option>
        </select>
      </div>

      <div>
        <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
          Feedback
        </label>
        <textarea
          id="feedback"
          name="feedback"
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Provide detailed feedback for the task executor"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
