'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import EvidenceForm from '@/components/forms/EvidenceForm';
import QAReviewForm from '@/components/forms/QAReviewForm';
import TimeLogForm from '@/components/forms/TimeLogForm';
import Timer from '@/components/tasks/Timer';
import TaskStatusTimeline from '@/components/tasks/TaskStatusTimeline';
import TaskReassignForm from '@/components/tasks/TaskReassignForm';
import ExtendDueDateForm from '@/components/tasks/ExtendDueDateForm';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_to?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  evidence: Array<{
    id: string;
    file_url: string;
    description?: string;
    created_at: string;
  }>;
  qa_reviews: Array<{
    id: string;
    status: string;
    feedback?: string;
    created_at: string;
  }>;
  status_history?: Array<{
    id: string;
    operation: string;
    old_value?: { status?: string };
    new_value?: { status?: string };
    created_by?: string;
    created_at: string;
  }>;
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  qa_review: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700', // Legacy alias
  blocked: 'bg-red-100 text-red-700', // Legacy alias
};

const priorityColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
};

type Props = {
  params: Promise<{ id: string }>;
};

export default function TaskDetailPage({ params }: Props) {
  const { data: session } = useSession();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [showQAForm, setShowQAForm] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showTimeLogForm, setShowTimeLogForm] = useState(false);
  const [showReassignForm, setShowReassignForm] = useState(false);
  const [showExtendDueForm, setShowExtendDueForm] = useState(false);
  const [startingTask, setStartingTask] = useState(false);
  const [statusHistoryLoading, setStatusHistoryLoading] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get ID from params
  useEffect(() => {
    params.then((p) => setTaskId(p.id));
  }, [params]);

  useEffect(() => {
    if (!taskId) return;

    async function fetchTask() {
      try {
        const res = await fetch(`/api/tasks/${taskId}`);

        if (!res.ok) {
          if (res.status === 404) {
            setError('Task not found');
          } else {
            setError('Failed to load task');
          }
          return;
        }

        const data = await res.json();
        setTask(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchTask();
  }, [taskId]);

  // Polling: Refresh status every 5 seconds
  useEffect(() => {
    if (!taskId || !task) return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        if (res.ok) {
          const newTask = await res.json();
          if (newTask.status !== task.status) {
            setTask(newTask);
          }
        }
      } catch (err) {
        console.error('Failed to poll task status:', err);
      }
    };

    pollIntervalRef.current = setInterval(pollStatus, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [taskId, task?.status]);

  const handleStartWork = async () => {
    if (!taskId || !task) return;

    setStartingTask(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to start task');
        setStartingTask(false);
        return;
      }

      const updatedTask = await res.json();
      setTask(updatedTask);
      setShowTimer(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setStartingTask(false);
    }
  };

  const refreshEvidence = async () => {
    if (!taskId) return;

    try {
      const res = await fetch(`/api/evidence?task_id=${taskId}`);
      if (res.ok) {
        const { data } = await res.json();
        setTask((prev) => prev ? { ...prev, evidence: data } : null);
      }
    } catch (err) {
      console.error('Failed to refresh evidence:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error || !task) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Task not found'}
      </div>
    );
  }

  return (
    <div>
      <Link href="/tasks" className="text-blue-600 hover:underline mb-6 block">
        ← Back to Tasks
      </Link>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{task.title}</h1>

            <div className="flex gap-2 mb-6">
              <span className={`px-3 py-1 text-sm font-medium rounded ${statusColors[task.status as keyof typeof statusColors] || 'bg-gray-100'}`}>
                {task.status}
              </span>
              <span className={`px-3 py-1 text-sm font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                {task.priority} priority
              </span>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700">{task.description || 'No description provided'}</p>
            </div>

            {task.due_date && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Due: <strong>{new Date(task.due_date).toLocaleDateString('pt-BR')}</strong>
                </p>
              </div>
            )}

            {/* Status Timeline */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status History</h3>
              <TaskStatusTimeline
                statusHistory={task.status_history}
                loading={statusHistoryLoading}
              />
            </div>

            {/* Start Work Button */}
            {session?.user?.role === 'executor' && task.status === 'pending' && (
              <button
                onClick={handleStartWork}
                disabled={startingTask}
                className="mt-6 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {startingTask ? 'Starting...' : '▶ Start Work'}
              </button>
            )}

            {/* Task Metadata */}
            <div className="mt-6 space-y-2 text-sm text-gray-600">
              <p>
                Created: <strong>{new Date(task.created_at).toLocaleDateString('pt-BR')}</strong>
              </p>
              <p>
                Last Updated: <strong>{new Date(task.updated_at).toLocaleDateString('pt-BR')}</strong>
              </p>
            </div>
          </div>

          {/* Evidence Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Evidence</h2>

            {task.evidence && task.evidence.length > 0 ? (
              <div className="space-y-3 mb-6">
                {task.evidence.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      📎 {item.file_url.split('/').pop()}
                    </a>
                    {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mb-6">No evidence submitted yet</p>
            )}

            {session?.user?.role === 'executor' && (
              <>
                <button
                  onClick={() => setShowEvidenceForm(!showEvidenceForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {showEvidenceForm ? '✕ Cancel' : '+ Submit Evidence'}
                </button>

                {showEvidenceForm && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <EvidenceForm
                      taskId={taskId || task.id}
                      onSubmit={() => {
                        setShowEvidenceForm(false);
                        refreshEvidence();
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Timer & Time Logging */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Tracking</h2>

            {showTimer ? (
              <div className="mb-6">
                <Timer
                  onStop={(minutes) => {
                    setShowTimer(false);
                    setShowTimeLogForm(true);
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowTimer(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                ▶ Start Timer
              </button>
            )}

            {showTimeLogForm && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <TimeLogForm
                  taskId={taskId || task.id}
                  onSubmit={() => {
                    setShowTimeLogForm(false);
                    setShowTimer(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QA Reviews */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">QA Reviews</h3>

            {task.qa_reviews && task.qa_reviews.length > 0 ? (
              <div className="space-y-3 mb-4">
                {task.qa_reviews.map((review) => (
                  <div key={review.id} className="border-l-4 border-blue-500 p-3 bg-blue-50">
                    <p className="font-medium text-gray-900">{review.status}</p>
                    {review.feedback && (
                      <p className="text-sm text-gray-600 mt-1">{review.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-4">No QA reviews yet</p>
            )}

            {session?.user?.role === 'qa' && (
              <>
                <button
                  onClick={() => setShowQAForm(!showQAForm)}
                  className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {showQAForm ? '✕ Cancel' : '+ Submit Review'}
                </button>

                {showQAForm && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <QAReviewForm
                      taskId={taskId || task.id}
                      onSubmit={() => {
                        setShowQAForm(false);
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Task Management (Admin/Head) */}
          {['admin', 'head'].includes(session?.user?.role || '') && (
            <>
              {/* Reassign Task */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reassign Task</h3>

                <button
                  onClick={() => setShowReassignForm(!showReassignForm)}
                  className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  {showReassignForm ? '✕ Cancel' : '👤 Reassign'}
                </button>

                {showReassignForm && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <TaskReassignForm
                      taskId={taskId || task.id}
                      currentAssignee={task.assigned_to}
                      onSubmit={(data) => {
                        setShowReassignForm(false);
                        setTask({ ...task, assigned_to: data.assigned_to });
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Extend Due Date */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Extend Due Date</h3>

                <button
                  onClick={() => setShowExtendDueForm(!showExtendDueForm)}
                  className="w-full px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  {showExtendDueForm ? '✕ Cancel' : '📅 Extend'}
                </button>

                {showExtendDueForm && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <ExtendDueDateForm
                      taskId={taskId || task.id}
                      currentDueDate={task.due_date}
                      onSubmit={(data) => {
                        setShowExtendDueForm(false);
                        setTask({ ...task, due_date: data.due_date });
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Assigned to</p>
                <p className="font-medium text-gray-900">
                  {task.assigned_to || 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Created</p>
                <p className="font-medium text-gray-900">
                  {new Date(task.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Last Updated</p>
                <p className="font-medium text-gray-900">
                  {new Date(task.updated_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
