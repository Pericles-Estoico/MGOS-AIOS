'use client';

import { FormEvent, useState } from 'react';

interface EvidenceFormProps {
  taskId: string;
  onSubmit?: (data: { file_url: string; description?: string }) => void;
}

export default function EvidenceForm({ taskId, onSubmit }: EvidenceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          file_url: formData.get('file_url'),
          description: formData.get('description'),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit evidence');
        return;
      }

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      onSubmit?.({
        file_url: formData.get('file_url') as string,
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
          Evidence submitted successfully!
        </div>
      )}

      <div>
        <label htmlFor="file_url" className="block text-sm font-medium text-gray-700 mb-2">
          File URL
        </label>
        <input
          id="file_url"
          name="file_url"
          type="url"
          required
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/evidence.pdf"
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
          placeholder="Brief description of the evidence"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
      >
        {loading ? 'Uploading...' : 'Submit Evidence'}
      </button>
    </form>
  );
}
