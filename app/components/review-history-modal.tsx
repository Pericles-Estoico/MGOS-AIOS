'use client';

import { useEffect, useState } from 'react';

interface ReviewEntry {
  id: string;
  action: string;
  feedback: string | null;
  reviewer_id: string;
  reviewer_name: string;
  created_at: string;
}

interface ReviewHistoryModalProps {
  taskId: string;
  onClose: () => void;
}

export default function ReviewHistoryModal({
  taskId,
  onClose,
}: ReviewHistoryModalProps) {
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/qa-reviews/${taskId}`);
        if (!res.ok) throw new Error('Failed to fetch reviews');

        const data = await res.json();
        setReviews(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [taskId]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'approved':
        return (
          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            ✓ Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
            ✗ Rejected
          </span>
        );
      case 'requested_changes':
        return (
          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
            ↻ Changes Requested
          </span>
        );
      default:
        return (
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Review History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No reviews recorded yet
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="mb-2">{getActionBadge(review.action)}</div>
                      <p className="text-sm text-gray-600">
                        <strong>{review.reviewer_name}</strong>
                        {' - '}
                        {new Date(review.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {review.feedback && (
                    <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-blue-300">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {review.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
