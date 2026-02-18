'use client';

import { useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Sprint {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  goals: string;
  created_at: string;
  task_count?: number;
  completed_count?: number;
}

export default function SprintsPage() {
  const router = useRouter();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewSprint, setShowNewSprint] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    goals: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  });

  useEffect(() => {
    const checkAuth = async () => {
      const userSession = await getSession();
      if (!userSession) {
        router.push('/login');
        return;
      }
      if (!['admin', 'head'].includes(userSession.user.role)) {
        router.push('/dashboard');
        return;
      }
      await fetchSprints();
    };
    checkAuth();
  }, [router]);

  const fetchSprints = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/sprints');
      if (!res.ok) {
        throw new Error('Failed to fetch sprints');
      }

      const data = await res.json();
      setSprints(data.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'planning',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create sprint');
      }

      setFormData({
        name: '',
        goals: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      });
      setShowNewSprint(false);
      await fetchSprints();
    } catch (error) {
      console.error('Error creating sprint:', error);
      alert('Erro ao criar sprint');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sprints</h1>
          <p className="text-gray-600 mt-2">Gerencie e acompanhe os sprints da equipe</p>
        </div>
        <button
          onClick={() => setShowNewSprint(!showNewSprint)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showNewSprint ? 'Cancelar' : '+ Novo Sprint'}
        </button>
      </div>

      {error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {showNewSprint && (
        <div className="border rounded-lg bg-white p-6">
          <h2 className="text-lg font-bold mb-4">Criar Novo Sprint</h2>
          <form onSubmit={handleCreateSprint} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome do Sprint
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: Sprint 1 - Features Básicas"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Objetivos
              </label>
              <textarea
                value={formData.goals}
                onChange={(e) =>
                  setFormData({ ...formData, goals: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descreva os objetivos principais do sprint"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data de Início
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data de Fim
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Criar Sprint
              </button>
              <button
                type="button"
                onClick={() => setShowNewSprint(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {sprints.length === 0 ? (
        <div className="border rounded-lg bg-white p-12 text-center">
          <p className="text-gray-500 mb-4">Nenhum sprint criado ainda</p>
          <button
            onClick={() => setShowNewSprint(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Criar Primeiro Sprint
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sprints.map((sprint) => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              onView={() => router.push(`/sprints/${sprint.id}`)}
              statusColor={getStatusColor(sprint.status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SprintCardProps {
  sprint: Sprint;
  onView: () => void;
  statusColor: string;
}

function SprintCard({ sprint, onView, statusColor }: SprintCardProps) {
  const daysRemaining = Math.ceil(
    (new Date(sprint.end_date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const progress = sprint.task_count
    ? Math.round(((sprint.completed_count || 0) / sprint.task_count) * 100)
    : 0;

  return (
    <div
      className="border rounded-lg bg-white p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onView}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{sprint.name}</h3>
          <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
            {sprint.status}
          </span>
        </div>
      </div>

      {sprint.goals && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {sprint.goals}
        </p>
      )}

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-gray-500">Tasks</p>
            <p className="font-bold">{sprint.task_count || 0}</p>
          </div>
          <div>
            <p className="text-gray-500">Completas</p>
            <p className="font-bold text-green-600">
              {sprint.completed_count || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Dias</p>
            <p className={`font-bold ${daysRemaining <= 0 ? 'text-red-600' : ''}`}>
              {daysRemaining}d
            </p>
          </div>
        </div>
      </div>

      <button
        className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-semibold"
        onClick={(e) => {
          e.stopPropagation();
          onView();
        }}
      >
        Ver Detalhes →
      </button>
    </div>
  );
}
