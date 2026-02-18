'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ReassignModalProps {
  taskId: string;
  currentAssigneeId: string;
  currentAssigneeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReassignModal({
  taskId,
  currentAssigneeId,
  currentAssigneeName,
  isOpen,
  onClose,
  onSuccess,
}: ReassignModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users?limit=100');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error('Selecione um novo responsável');
      return;
    }

    if (selectedUserId === currentAssigneeId) {
      toast.error('Selecione um usuário diferente do atual');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/tasks/${taskId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_assignee_id: selectedUserId,
          reason: reason || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to reassign task');
      }

      toast.success('Tarefa reatribuída com sucesso!');
      setSelectedUserId('');
      setReason('');
      onClose();
      onSuccess();
    } catch (err) {
      console.error('Error reassigning task:', err);
      toast.error('Erro ao reatribuir tarefa');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Reatribuir Tarefa
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleReassign} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Responsável Atual
              </label>
              <div className="px-3 py-2 border rounded-lg bg-gray-50 text-gray-600">
                {currentAssigneeName}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Novo Responsável *
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="">Selecione um usuário...</option>
                {users
                  .filter((u) => u.id !== currentAssigneeId)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
              </select>
            </div>

            {selectedUser && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Será reatribuído para <strong>{selectedUser.name}</strong>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motivo (opcional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Balanceamento de carga, indisponibilidade..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                disabled={submitting}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={submitting || !selectedUserId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? 'Reatribuindo...' : 'Reatribuir'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
