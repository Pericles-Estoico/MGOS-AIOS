'use client';

import { FormEvent, useState, ChangeEvent } from 'react';

interface EvidenceFormProps {
  taskId: string;
  onSubmit?: (data: { file_url: string; description?: string }) => void;
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export default function EvidenceForm({ taskId, onSubmit }: EvidenceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleFileUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFileUrl(url);

    if (url && !isValidUrl(url)) {
      setUrlError('Please enter a valid URL (e.g., https://example.com/file)');
    } else {
      setUrlError(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate URL before submission
    if (!fileUrl || !isValidUrl(fileUrl)) {
      setError('Please provide a valid URL');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          file_url: fileUrl,
          description: description || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit evidence');
        return;
      }

      setSuccess(true);
      setFileUrl('');
      setDescription('');
      onSubmit?.({
        file_url: fileUrl,
        description: description,
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
          File URL <span className="text-red-500">*</span>
        </label>
        <input
          id="file_url"
          name="file_url"
          type="text"
          required
          disabled={loading}
          value={fileUrl}
          onChange={handleFileUrlChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            urlError ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="https://example.com/evidence.pdf"
        />
        {urlError && <p className="text-sm text-red-600 mt-1">{urlError}</p>}
        <p className="text-xs text-gray-500 mt-1">
          Provide a URL to your evidence (must start with http:// or https://)
        </p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description <span className="text-gray-500">(Optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          disabled={loading}
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
          maxLength={1000}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Brief description of the evidence (what does this prove?)"
        />
        <p className="text-xs text-gray-500 mt-1">
          {description.length}/1000 characters
        </p>
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
