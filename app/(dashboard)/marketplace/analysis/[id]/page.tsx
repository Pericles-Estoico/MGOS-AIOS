'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, AlertCircle, Check, X, ChevronDown } from 'lucide-react';

interface AnalysisPlan {
  id: string;
  title: string;
  channels: string[];
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'done';
  plan_data: {
    summary: string;
    opportunities: Array<{
      id: number;
      priority: 'alta' | 'media' | 'baixa';
      title: string;
      what: string;
      why: string;
      how: string;
      agent: string;
      expectedImpact: string;
      metric: string;
    }>;
    phases: Array<{
      number: number;
      name: string;
      weeks: string;
      tasks: string[];
      investment: string;
      expectedImpact: string;
    }>;
    metrics: Array<{
      label: string;
      baseline: string;
      goal: string;
      phase: string;
    }>;
  };
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  phase1_tasks_created?: boolean;
  phase1_task_ids?: string[];
}

const PRIORITY_CONFIG = {
  alta: { badge: '🔴 ALTA', color: 'bg-red-100 text-red-700' },
  media: { badge: '🟡 MÉDIA', color: 'bg-yellow-100 text-yellow-700' },
  baixa: { badge: '🟢 BAIXA', color: 'bg-green-100 text-green-700' },
};

export default function AnalysisDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const [plan, setPlan] = useState<AnalysisPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [expandedOpp, setExpandedOpp] = useState<number | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/marketplace/analysis/${planId}`);
        if (response.ok) {
          const data = await response.json();
          setPlan(data);
        } else {
          console.error('Error:', await response.json());
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  const handleApprove = async () => {
    try {
      setIsActing(true);
      const response = await fetch(`/api/marketplace/analysis/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (response.ok) {
        const result = await response.json();
        setPlan(prev =>
          prev
            ? {
                ...prev,
                status: 'approved',
                phase1_tasks_created: true,
                phase1_task_ids: result.taskIds,
              }
            : null
        );
        // Show success toast
        setTimeout(() => {
          router.push('/marketplace/tasks?status=pending');
        }, 1500);
      } else {
        console.error('Error approving:', await response.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;

    try {
      setIsActing(true);
      const response = await fetch(`/api/marketplace/analysis/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectionReason }),
      });

      if (response.ok) {
        setPlan(prev =>
          prev
            ? {
                ...prev,
                status: 'rejected',
                rejection_reason: rejectionReason,
              }
            : null
        );
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        console.error('Error rejecting:', await response.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="mt-4 text-gray-600">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Análise não encontrada</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:underline"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: { label: '⏳ Aguardando Aprovação', color: 'bg-yellow-50 border-yellow-200' },
    approved: { label: '✅ Aprovado', color: 'bg-green-50 border-green-200' },
    rejected: { label: '❌ Rejeitado', color: 'bg-red-50 border-red-200' },
    executing: { label: '🚀 Em Execução', color: 'bg-blue-50 border-blue-200' },
    done: { label: '🎉 Concluído', color: 'bg-green-100 border-green-300' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{plan.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className={`px-3 py-1 rounded-full font-medium ${
              statusConfig[plan.status].color
            }`}>
              {statusConfig[plan.status].label}
            </span>
            <span className="text-sm text-gray-600">
              Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Rejection Reason Alert */}
      {plan.status === 'rejected' && plan.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-red-600 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-red-900">Motivo da Rejeição:</p>
            <p className="text-red-800 text-sm mt-1">{plan.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {plan.status === 'approved' && plan.phase1_tasks_created && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <Check className="text-green-600 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-green-900">✅ Plano aprovado!</p>
            <p className="text-green-800 text-sm mt-1">
              {plan.phase1_task_ids?.length || 0} tarefas da Fase 1 foram criadas em /marketplace/tasks
            </p>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-3">📋 Diagnóstico</h2>
        <p className="text-gray-700 leading-relaxed">{plan.plan_data.summary}</p>
      </div>

      {/* Opportunities Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">
          💡 {plan.plan_data.opportunities.length} Oportunidades
        </h2>
        <div className="space-y-3">
          {plan.plan_data.opportunities.map(opp => (
            <div key={opp.id} className="border rounded-lg overflow-hidden">
              <button
                onClick={() =>
                  setExpandedOpp(expandedOpp === opp.id ? null : opp.id)
                }
                className="w-full p-4 hover:bg-gray-50 transition flex items-center gap-3 text-left"
              >
                <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_CONFIG[opp.priority].color}`}>
                  {PRIORITY_CONFIG[opp.priority].badge}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{opp.title}</p>
                  <p className="text-sm text-gray-600">Agente: {opp.agent}</p>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition ${
                    expandedOpp === opp.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedOpp === opp.id && (
                <div className="bg-gray-50 p-4 border-t space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">O quê:</p>
                    <p className="text-sm text-gray-600 mt-1">{opp.what}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Por quê:</p>
                    <p className="text-sm text-gray-600 mt-1">{opp.why}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Como:</p>
                    <p className="text-sm text-gray-600 mt-1">{opp.how}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-700">Impacto Esperado:</p>
                      <p className="text-sm text-gray-900 font-semibold mt-1">
                        {opp.expectedImpact}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">Métrica:</p>
                      <p className="text-sm text-gray-900 font-semibold mt-1">
                        {opp.metric}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Phases Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">📅 Plano de Implementação</h2>

        {/* Timeline */}
        <div className="space-y-4">
          {plan.plan_data.phases.map((phase, idx) => (
            <div key={phase.number}>
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {phase.number}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{phase.weeks}</p>
                  <ul className="mt-2 space-y-1">
                    {phase.tasks.map((task, taskIdx) => (
                      <li key={taskIdx} className="text-sm text-gray-700">
                        • {task}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Investimento:</p>
                      <p className="text-gray-600">{phase.investment}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Impacto Esperado:</p>
                      <p className="text-gray-600">{phase.expectedImpact}</p>
                    </div>
                  </div>
                </div>
              </div>
              {idx < plan.plan_data.phases.length - 1 && (
                <div className="ml-4 h-8 border-l-2 border-gray-300 my-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">📊 Métricas de Sucesso</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-700">Métrica</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Baseline</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Meta</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Fase</th>
              </tr>
            </thead>
            <tbody>
              {plan.plan_data.metrics.map((metric, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-3 px-3 font-medium text-gray-900">
                    {metric.label}
                  </td>
                  <td className="py-3 px-3 text-gray-600">{metric.baseline}</td>
                  <td className="py-3 px-3 text-gray-900 font-semibold">
                    {metric.goal}
                  </td>
                  <td className="py-3 px-3 text-gray-600">{metric.phase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      {plan.status === 'pending' && (
        <div className="flex gap-3 sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-lg">
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isActing}
            className="flex-1 px-4 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            <X size={18} />
            Rejeitar Plano
          </button>
          <button
            onClick={handleApprove}
            disabled={isActing}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            {isActing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processando...
              </>
            ) : (
              <>
                <Check size={18} />
                Aprovar Plano
              </>
            )}
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Rejeitar Plano</h2>
            <p className="text-gray-600 mb-4">
              Informe o motivo da rejeição para feedback aos agentes:
            </p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Ex: Falta análise do comportamento do consumidor, dados de sazonalidade incompletos..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={isActing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isActing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
