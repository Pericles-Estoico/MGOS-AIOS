'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';

interface SubTask {
  id: string;
  type: string;
  title: string;
  status: string;
  sub_agent_id: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface SubTaskStatus {
  total: number;
  pending: number;
  in_progress: number;
  awaiting_checkpoint: number;
  completed: number;
  failed: number;
}

interface SubAgentStatusResponse {
  success: boolean;
  task_id: string;
  summary: SubTaskStatus;
  subtasks: SubTask[];
  next_checkpoint: {
    id: string;
    type: string;
    title: string;
    checkpoint_data: Record<string, unknown>;
  } | null;
}

export default function SubAgentPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [status, setStatus] = useState<SubAgentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Fetch status on mount and periodically
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `/api/marketplace/sub-agents/${taskId}/status`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Error fetching status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, refreshInterval);

    return () => clearInterval(interval);
  }, [taskId, refreshInterval]);

  const handleApproveCheckpoint = async () => {
    if (!status?.next_checkpoint) return;

    setApproving(true);
    try {
      const response = await fetch(
        `/api/marketplace/sub-agents/${status.next_checkpoint.id}/checkpoint/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: 'Approved from UI',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve checkpoint');
      }

      // Refresh status
      const statusResponse = await fetch(
        `/api/marketplace/sub-agents/${taskId}/status`
      );
      const data = await statusResponse.json();
      setStatus(data);
    } catch (error) {
      console.error('Error approving checkpoint:', error);
      alert('Erro ao aprovar checkpoint');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectCheckpoint = async () => {
    if (!status?.next_checkpoint) return;

    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;

    setRejecting(true);
    try {
      const response = await fetch(
        `/api/marketplace/sub-agents/${status.next_checkpoint.id}/checkpoint/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reject checkpoint');
      }

      // Refresh status
      const statusResponse = await fetch(
        `/api/marketplace/sub-agents/${taskId}/status`
      );
      const data = await statusResponse.json();
      setStatus(data);
    } catch (error) {
      console.error('Error rejecting checkpoint:', error);
      alert('Erro ao rejeitar checkpoint');
    } finally {
      setRejecting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'awaiting_checkpoint':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">Em andamento</Badge>;
      case 'awaiting_checkpoint':
        return <Badge className="bg-yellow-100 text-yellow-800">Aguardando aprovação</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Falha</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800">Pendente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando status dos sub-agentes...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-6">
        <Card className="border-red-200 p-6">
          <p className="text-red-600">Erro ao carregar status dos sub-agentes</p>
        </Card>
      </div>
    );
  }

  const progressPercentage = status.summary.total
    ? Math.round((status.summary.completed / status.summary.total) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Execução de Sub-Agentes</h1>
        <p className="text-gray-600 mt-2">
          Tarefa: <code className="text-sm">{taskId}</code>
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Progresso Geral</h2>
            <p className="text-sm text-gray-600">
              {status.summary.completed} de {status.summary.total} subtarefas concluídas
            </p>
          </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-400">{status.summary.pending}</p>
                <p className="text-xs text-gray-600">Pendente</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{status.summary.in_progress}</p>
                <p className="text-xs text-gray-600">Em andamento</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {status.summary.awaiting_checkpoint}
                </p>
                <p className="text-xs text-gray-600">Aguardando aprovação</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{status.summary.completed}</p>
                <p className="text-xs text-gray-600">Concluído</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{status.summary.failed}</p>
                <p className="text-xs text-gray-600">Falha</p>
              </div>
            </div>
          </div>
        </Card>

      {/* Next Checkpoint Alert */}
      {status.next_checkpoint && (
        <Card className="border-yellow-200 bg-yellow-50 p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Checkpoint Aguardando Aprovação
            </h2>
            <div>
              <h3 className="font-semibold">{status.next_checkpoint.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Tipo: <span className="font-mono">{status.next_checkpoint.type}</span>
              </p>
            </div>

            {/* Checkpoint Data Preview */}
            {status.next_checkpoint.checkpoint_data && (
              <div className="bg-white p-4 rounded border border-yellow-200 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-700 mb-2">DADOS PARA REVISÃO:</p>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                  {JSON.stringify(status.next_checkpoint.checkpoint_data, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleApproveCheckpoint}
                disabled={approving}
                className="bg-green-600 hover:bg-green-700"
              >
                {approving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Aprovando...
                  </>
                ) : (
                  'Aprovar'
                )}
              </Button>
              <Button
                onClick={handleRejectCheckpoint}
                disabled={rejecting}
                variant="outline"
                className="border-red-300 hover:bg-red-50"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rejeitando...
                  </>
                ) : (
                  'Rejeitar'
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Subtasks List */}
      <Card className="p-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Subtarefas</h2>
          <div className="space-y-3">
            {status.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex gap-3 flex-1">
                  {getStatusIcon(subtask.status)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{subtask.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Agente: <span className="font-mono">{subtask.sub_agent_id}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Tipo: <span className="font-mono">{subtask.type}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {getStatusBadge(subtask.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Refresh Control */}
      <Card className="p-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Atualização automática:</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="text-sm border rounded px-2 py-1"
            >
              <option value={2000}>2 segundos</option>
              <option value={5000}>5 segundos</option>
              <option value={10000}>10 segundos</option>
              <option value={0}>Desativado</option>
            </select>
          </div>
      </Card>
    </div>
  );
}
