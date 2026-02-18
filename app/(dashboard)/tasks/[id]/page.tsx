'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import EvidenceForm from '@/components/forms/EvidenceForm';
import QAReviewForm from '@/components/forms/QAReviewForm';
import TimeLogForm from '@/components/forms/TimeLogForm';
import Timer from '@/components/tasks/Timer';

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
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
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
                        // Refresh task to show new evidence
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

          {/* Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>

            <div className="space-y-3 text-sm">
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
