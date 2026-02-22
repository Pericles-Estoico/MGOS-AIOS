'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Clock, AlertCircle, Zap } from 'lucide-react';

interface TimeLog {
  id: string;
  userName: string;
  userEmail: string;
  taskId: string;
  taskTitle: string;
  durationMinutes: number;
  hours: string;
  notes?: string;
  loggedAt: string;
}

export default function TimeLogsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin or head
  useEffect(() => {
    if (session && session.user.role && !['admin', 'head'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Fetch time logs
  useEffect(() => {
    async function fetchTimeLogs() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/time-logs');
        if (!response.ok) throw new Error('Erro ao buscar time logs');

        const { data } = await response.json();
        setTimeLogs(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchTimeLogs();
    }
  }, [session?.user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Zap className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando time logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Clock className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Time Logs Report</h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Rastreamento de Tempo da Equipe</h2>

        {timeLogs.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Nenhum time log encontrado</p>
        ) : (
          <div className="space-y-4">
            {timeLogs.map((log) => (
              <div key={log.id} className="flex justify-between items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{log.userName}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">{log.taskTitle}</span> - {log.hours}h
                  </p>
                  {log.notes && (
                    <p className="text-sm text-gray-500 mt-2 italic">Notas: {log.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-gray-500 text-sm">
                    {new Date(log.loggedAt).toLocaleDateString('pt-BR')}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {log.durationMinutes}min
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
