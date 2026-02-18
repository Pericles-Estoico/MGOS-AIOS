'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Loader } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TaskCommentsProps {
  taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${taskId}/comments`);
      if (!response.ok) throw new Error('Falha ao carregar comentários');
      const data = await response.json();
      setComments(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) throw new Error('Falha ao enviar comentário');

      const comment = await response.json();
      setComments([...comments, comment]);
      setNewComment('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar comentário');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5" />
        <h3 className="font-semibold">Comentários ({comments.length})</h3>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Nenhum comentário ainda</p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-3">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={`https://avatar.vercel.sh/${comment.user.email}`} />
                  <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">{comment.user.name}</p>
                    <span className="text-xs text-gray-500">
                      {format(new Date(comment.created_at), 'HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 break-words">{comment.content}</p>
                  {comment.is_edited && (
                    <p className="text-xs text-gray-400 mt-1">Editado</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {session && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Adicionar comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={submitting}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={submitting || !newComment.trim()}
            size="sm"
          >
            {submitting ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
