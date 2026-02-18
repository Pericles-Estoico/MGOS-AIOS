'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

interface PresenceUser {
  user_id: string;
  name: string;
  email: string;
  status: 'online' | 'offline' | 'idle';
  is_typing: boolean;
}

interface TaskPresenceProps {
  taskId: string;
}

export function TaskPresence({ taskId }: TaskPresenceProps) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !taskId) return;

    // Update user presence
    const updatePresence = async () => {
      try {
        await fetch('/api/tasks/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_id: taskId,
            status: document.hidden ? 'idle' : 'online',
          }),
        });
      } catch (err) {
        console.error('Failed to update presence:', err);
      }
    };

    updatePresence();

    // Fetch presence data
    const fetchPresence = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}/presence`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch presence:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPresence();

    // Update every 30 seconds
    const interval = setInterval(updatePresence, 30000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      updatePresence();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, taskId]);

  if (loading || users.length === 0) return null;

  const onlineUsers = users.filter((u) => u.status === 'online');

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
      <Eye className="w-4 h-4 text-blue-600" />
      <div className="flex items-center gap-1">
        {onlineUsers.slice(0, 3).map((user) => (
          <Avatar key={user.user_id} className="w-6 h-6 border border-blue-200">
            <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        ))}
        {onlineUsers.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{onlineUsers.length - 3}
          </Badge>
        )}
      </div>
      <span className="text-xs text-blue-700">
        {onlineUsers.length} {onlineUsers.length === 1 ? 'pessoa visualizando' : 'pessoas visualizando'}
      </span>
    </div>
  );
}
