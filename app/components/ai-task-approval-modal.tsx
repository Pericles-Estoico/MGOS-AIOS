/**
 * Component: AITaskApprovalModal
 * Purpose: Admin workflow for reviewing and approving AI-generated task cards
 * Features:
 * - Display task details (change description, impact, steps)
 * - Override estimated hours
 * - Assign to executor
 * - Approve, Edit, or Reject
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Copy, Check } from 'lucide-react';
import { MarketplaceIntelBadge, ChannelTag } from './marketplace-intel-badge';

interface AITaskApprovalModalProps {
  isOpen: boolean;
  task: {
    id: string;
    title: string;
    description: string;
    step_by_step: string;
    estimated_hours?: number;
    priority: string;
    channel: string;
    ai_change_type: string;
    ai_source_url?: string;
    ai_generated_at: string;
  };
  users: Array<{ id: string; name: string; email: string }>;
  onApprove: (
    taskId: string,
    assignedTo?: string,
    estimatedHours?: number
  ) => Promise<void>;
  onReject: (taskId: string) => Promise<void>;
  onClose: () => void;
}

export function AITaskApprovalModal({
  isOpen,
  task,
  users,
  onApprove,
  onReject,
  onClose,
}: AITaskApprovalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(
    task.estimated_hours?.toString() || ''
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await onApprove(
        task.id,
        assignedTo || undefined,
        estimatedHours ? parseFloat(estimatedHours) : undefined
      );
      onClose();
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (confirm('Tem certeza que deseja rejeitar esta tarefa?')) {
      setIsLoading(true);
      try {
        await onReject(task.id);
        onClose();
      } catch (error) {
        console.error('Rejection failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-lg bg-white shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🤖</div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Revisar Tarefa de Inteligência
              </h2>
              <p className="text-sm text-gray-600">
                Aprovação de mudança detectada no marketplace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-md transition"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {/* Task Header */}
          <div className="mb-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {task.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <MarketplaceIntelBadge
                    channel={task.channel}
                    approved={false}
                    size="sm"
                  />
                  <ChannelTag channel={task.channel} size="sm" />
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      priorityColors[task.priority as keyof typeof priorityColors]
                    }`}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                  {task.ai_change_type && (
                    <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                      {task.ai_change_type}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6 space-y-2">
            <h4 className="font-semibold text-gray-900">Descrição da Mudança</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
              {task.description}
            </p>
          </div>

          {/* Step-by-Step */}
          <div className="mb-6 space-y-2">
            <h4 className="font-semibold text-gray-900">Passo a Passo</h4>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
              <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                {task.step_by_step}
              </pre>
            </div>
          </div>

          {/* Metadata */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            {task.estimated_hours && (
              <div>
                <p className="text-sm text-gray-600">Horas Estimadas (IA)</p>
                <p className="text-lg font-semibold text-gray-900">
                  {task.estimated_hours}h
                </p>
              </div>
            )}
            {task.ai_source_url && (
              <div>
                <p className="text-sm text-gray-600">Fonte Oficial</p>
                <a
                  href={task.ai_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 break-all"
                >
                  {task.ai_source_url.substring(0, 50)}...
                </a>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Detectado em</p>
              <p className="text-sm text-gray-900">
                {new Date(task.ai_generated_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Approval Form */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
            <h4 className="font-semibold text-gray-900">Aprovar Tarefa</h4>

            {/* Estimated Hours Override */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horas Estimadas (opcional - para revisar)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={task.estimated_hours?.toString()}
              />
              <p className="text-xs text-gray-600 mt-1">
                Deixe em branco para usar a estimativa da IA
              </p>
            </div>

            {/* Assign To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Atribuir a (opcional)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecionar executor...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                Pode atribuir depois via fluxo padrão
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={handleReject}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ❌ Rejeitar
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? '⏳ Processando...' : '✅ Aprovar e Ativar'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
