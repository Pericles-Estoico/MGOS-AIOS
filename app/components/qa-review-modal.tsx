'use client';

import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  priority: string;
  users: { name: string };
}

interface QAReviewModalProps {
  task: Task;
  onClose: () => void;
}

export default function QAReviewModal({ task, onClose }: QAReviewModalProps) {
  const [action, setAction] = useState<'approved' | 'rejected' | 'requested_changes' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!action) {
      setError('Please select an action');
      return;
    }

    if (action === 'requested_changes' && !feedback.trim()) {
      setError('Please provide feedback for requested changes');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/qa-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          action,
          feedback: feedback.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Review Task</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Task Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {task.title}
            </h3>
            <p className="text-gray-700 mb-4">{task.description}</p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Executor</p>
                  <p className="font-semibold text-gray-900">
                    {task.users.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Priority</p>
                  <p
                    className={`font-semibold ${
                      task.priority === 'critical'
                        ? 'text-red-600'
                        : task.priority === 'high'
                          ? 'text-orange-600'
                          : task.priority === 'medium'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                    }`}
                  >
                    {task.priority}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-4">
              Review Action
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderColor: action === 'approved' ? '#16a34a' : '#e5e7eb'
                }}>
                <input
                  type="radio"
                  name="action"
                  value="approved"
                  checked={action === 'approved'}
                  onChange={(e) => {
                    setAction(e.target.value as typeof action);
                    setFeedback('');
                  }}
                  className="mr-3"
                />
                <div>
                  <p className="font-semibold text-gray-900">✓ Approve</p>
                  <p className="text-sm text-gray-600">
                    Task meets quality standards
                  </p>
                </div>
              </label>

              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderColor: action === 'requested_changes' ? '#f59e0b' : '#e5e7eb'
                }}>
                <input
                  type="radio"
                  name="action"
                  value="requested_changes"
                  checked={action === 'requested_changes'}
                  onChange={(e) =>
                    setAction(e.target.value as typeof action)
                  }
                  className="mr-3"
                />
                <div>
                  <p className="font-semibold text-gray-900">↻ Request Changes</p>
                  <p className="text-sm text-gray-600">
                    Task needs revision with feedback
                  </p>
                </div>
              </label>

              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderColor: action === 'rejected' ? '#dc2626' : '#e5e7eb'
                }}>
                <input
                  type="radio"
                  name="action"
                  value="rejected"
                  checked={action === 'rejected'}
                  onChange={(e) => {
                    setAction(e.target.value as typeof action);
                    setFeedback('');
                  }}
                  className="mr-3"
                />
                <div>
                  <p className="font-semibold text-gray-900">✗ Reject</p>
                  <p className="text-sm text-gray-600">
                    Task does not meet requirements
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Feedback */}
          {(action === 'requested_changes' || action === 'rejected') && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                {action === 'requested_changes'
                  ? 'Detailed Feedback (Required)'
                  : 'Rejection Reason'}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={
                  action === 'requested_changes'
                    ? 'Provide specific feedback for the executor...'
                    : 'Explain why the task is rejected...'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !action}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
