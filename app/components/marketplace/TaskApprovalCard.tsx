'use client';

import { useState } from 'react';
import { Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { AssignModal, type Setor } from './AssignModal';

const AGENT_META: Record<string, { icon: string; label: string; color: string }> = {
  alex:    { icon: '🛒', label: 'Alex — Amazon',      color: 'bg-orange-50 text-orange-700 border-orange-200' },
  marina:  { icon: '🎯', label: 'Marina — MercadoLivre', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  sunny:   { icon: '🏪', label: 'Sunny — Shopee',     color: 'bg-red-50 text-red-700 border-red-200' },
  tren:    { icon: '👗', label: 'Tren — SHEIN',       color: 'bg-pink-50 text-pink-700 border-pink-200' },
  viral:   { icon: '📱', label: 'Viral — TikTok Shop',color: 'bg-gray-900 text-white border-gray-700' },
  premium: { icon: '💎', label: 'Premium — Kaway',    color: 'bg-purple-50 text-purple-700 border-purple-200' },
  nexo:    { icon: '🧠', label: 'Nexo — Master',      color: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const PRIORITY_COLOR: Record<string, string> = {
  high:   'text-red-600 font-semibold',
  medium: 'text-orange-500',
  low:    'text-green-600',
};

const PRIORITY_LABEL: Record<string, string> = {
  high: 'Alta', medium: 'Média', low: 'Baixa',
};

export interface ApprovalTask {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  estimated_hours: number;
  created_by_agent: string;
  marketplace: string;
  listing_id?: string;
  listing_url?: string;
  product_name?: string;
  selected?: boolean;
}

interface TaskApprovalCardProps {
  task: ApprovalTask;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
}

export function TaskApprovalCard({ task, selected, onToggleSelect, onApproved, onRejected }: TaskApprovalCardProps) {
  const [showAssign, setShowAssign] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const agent = AGENT_META[task.created_by_agent] ?? AGENT_META.nexo;

  async function handleApprove(setor: Setor, assignedTo?: string) {
    // Aprovação
    await fetch('/api/orchestration/tasks/approve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskIds: [task.id], approved: true, reason: 'Aprovado via painel' }),
    });

    // Assign se informado
    if (assignedTo) {
      await fetch('/api/orchestration/tasks/assign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, assignedTo, setor }),
      });
    } else {
      // Só setor — atualiza metadata
      await fetch(`/api/marketplace/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frente: setor }),
      }).catch(() => {});
    }

    setShowAssign(false);
    onApproved(task.id);
  }

  async function handleReject() {
    setRejecting(true);
    try {
      await fetch('/api/orchestration/tasks/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds: [task.id], approved: false, reason: 'Rejeitado pelo gestor' }),
      });
      onRejected(task.id);
    } finally {
      setRejecting(false);
    }
  }

  return (
    <>
      {showAssign && (
        <AssignModal
          taskTitle={task.title}
          onConfirm={handleApprove}
          onCancel={() => setShowAssign(false)}
        />
      )}

      <div className={`bg-white rounded-xl border shadow-sm p-4 transition ${selected ? 'border-teal-400 ring-1 ring-teal-400' : 'border-gray-100'}`}>
        <div className="flex items-start gap-3">
          {/* Checkbox de seleção em lote */}
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(task.id)}
            className="mt-1 w-4 h-4 accent-teal-600 cursor-pointer"
          />

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {/* Badge do agente especialista */}
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${agent.color}`}>
                    {agent.icon} {agent.label}
                  </span>
                  <span className={`text-xs ${PRIORITY_COLOR[task.priority]}`}>
                    ● {PRIORITY_LABEL[task.priority]}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.estimated_hours}h estimadas
                  </span>
                </div>

                <h4 className="font-medium text-gray-900 text-sm leading-snug">{task.title}</h4>

                {task.product_name && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Produto: {task.product_name}
                    {task.listing_url && (
                      <a href={task.listing_url} target="_blank" rel="noopener noreferrer"
                        className="ml-1 text-teal-500 hover:underline inline-flex items-center gap-0.5">
                        <ExternalLink className="w-3 h-3" /> ver listing
                      </a>
                    )}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => setShowAssign(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Aprovar
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="flex items-center gap-1 px-2.5 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition disabled:opacity-40"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Rejeitar
                </button>
              </div>
            </div>

            {/* Descrição expansível */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-gray-400 hover:text-gray-600 mt-1"
            >
              {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
            </button>
            {expanded && (
              <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
