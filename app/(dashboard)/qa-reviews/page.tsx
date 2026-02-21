'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import QAReviewModal from '@/components/qa-review-modal';
import ReviewHistoryModal from '@/components/review-history-modal';

interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  priority: string;
  created_at: string;
  submitted_at: string;
  users: { name: string; email: string };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function QAReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTasks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('status', 'submitted');
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (priority !== 'all') params.append('priority', priority);

      const res = await fetch(`/api/qa-reviews?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');

      const data = await res.json();
      setTasks(data.data || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, priority]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    // Check role
    if (!session.user?.role || !['qa', 'admin', 'head'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }

    fetchTasks(1);
  }, [status, session, fetchTasks, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">QA Review</h1>
        <p className="text-gray-600">
          Review submitted tasks and provide feedback
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <button
            onClick={() => fetchTasks(1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {tasks.length} of {pagination.total} submitted tasks
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No submitted tasks to review</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {task.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      Assigned to: <strong>{task.users.name}</strong>
                    </span>
                    <span>
                      Priority:{' '}
                      <span
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
                      </span>
                    </span>
                    <span>
                      Submitted:{' '}
                      {new Date(task.submitted_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowHistoryModal(true);
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    History
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowReviewModal(true);
                    }}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => fetchTasks(page)}
                className={`px-3 py-2 rounded-md transition-colors ${
                  page === pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>
      )}

      {/* Modals */}
      {selectedTask && showReviewModal && (
        <QAReviewModal
          task={selectedTask}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedTask(null);
            fetchTasks(pagination.page);
          }}
        />
      )}

      {selectedTask && showHistoryModal && (
        <ReviewHistoryModal
          taskId={selectedTask.id}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
