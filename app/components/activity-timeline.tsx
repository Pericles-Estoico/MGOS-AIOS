'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CheckCircle,
  MessageSquare,
  Users,
  AlertCircle,
  Activity,
  Loader,
} from 'lucide-react';
import type { ActivityEvent } from '@/lib/types/supabase';

interface ActivityTimelineProps {
  taskId: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  status_changed: <CheckCircle className="w-4 h-4 text-emerald-600" />,
  commented: <MessageSquare className="w-4 h-4 text-teal-600" />,
  reassigned: <Users className="w-4 h-4 text-cyan-600" />,
  created: <AlertCircle className="w-4 h-4 text-gray-600" />,
};

const actionLabels: Record<string, (details?: Record<string, unknown>) => string> = {
  status_changed: (d) => `Alterou o status para ${(d?.new_status as string) || 'desconhecido'}`,
  commented: () => 'Adicionou um comentário',
  reassigned: (d) => `Reatribuiu a tarefa para ${(d?.new_assignee as string) || 'desconhecido'}`,
  created: () => 'Criou a tarefa',
  task_created: () => 'Criou a tarefa',
};

export function ActivityTimeline({ taskId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${taskId}/activity`);
      if (!response.ok) throw new Error('Falha ao carregar atividades');
      const data = await response.json();
      setActivities(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-32">
          <Loader className="w-5 h-5 animate-spin" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <p className="text-sm text-red-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5" />
        <h3 className="font-semibold">Histórico de Atividades ({activities.length})</h3>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Nenhuma atividade registrada</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                  {actionIcons[activity.action] || <Activity className="w-4 h-4" />}
                </div>
                {index < activities.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                )}
              </div>

              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={`https://avatar.vercel.sh/${activity.user.email}`} />
                      <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{activity.user.name}</p>
                      <p className="text-sm text-gray-700">
                        {actionLabels[activity.action]?.(activity.details) || activity.action}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(activity.created_at), 'HH:mm:ss', { locale: ptBR })}
                  </span>
                </div>

                {activity.details?.old_status && (
                  <p className="text-xs text-gray-500 ml-8 mt-1">
                    {activity.details.old_status} → {activity.details.new_status}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
