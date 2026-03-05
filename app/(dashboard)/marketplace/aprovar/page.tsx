'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Filter } from 'lucide-react';
import { TaskApprovalCard, type ApprovalTask } from '@/components/marketplace/TaskApprovalCard';
import { AssignModal, type Setor } from '@/components/marketplace/AssignModal';
import { MARKETPLACE_LABELS, type Marketplace } from '@lib/types/products';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export default function AprovarPage() {
  const [tasks, setTasks] = useState<ApprovalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterMarketplace, setFilterMarketplace] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showBatchAssign, setShowBatchAssign] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orchestration/tasks?status=pending&limit=100');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTasks(data.tasks ?? []);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t) => t.id)));
    }
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  async function handleBatchApprove(setor: Setor, assignedTo?: string) {
    const ids = Array.from(selected);

    await fetch('/api/orchestration/tasks/approve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskIds: ids, approved: true, reason: 'Aprovação em lote' }),
    });

    if (assignedTo) {
      await Promise.all(ids.map((id) =>
        fetch('/api/orchestration/tasks/assign', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: id, assignedTo, setor }),
        })
      ));
    }

    ids.forEach(removeTask);
    setShowBatchAssign(false);
  }

  // Filtros
  const filtered = tasks
    .filter((t) => filterMarketplace === 'all' || t.marketplace === filterMarketplace)
    .filter((t) => filterPriority === 'all' || t.priority === filterPriority)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  // Agrupa por produto
  const grouped = filtered.reduce<Record<string, ApprovalTask[]>>((acc, t) => {
    const key = t.product_name || t.marketplace;
    acc[key] = acc[key] ?? [];
    acc[key].push(t);
    return acc;
  }, {});

  const pendingCount = tasks.length;

  return (
    <>
      {showBatchAssign && (
        <AssignModal
          taskTitle={`${selected.size} tasks selecionadas`}
          onConfirm={handleBatchApprove}
          onCancel={() => setShowBatchAssign(false)}
        />
      )}

      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Aprovação de Tasks</h1>
            <p className="text-gray-500 text-sm mt-1">
              Tasks geradas pelos agentes especialistas aguardando sua aprovação
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
              {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <Filter className="w-4 h-4 text-gray-400" />

          <select
            value={filterMarketplace}
            onChange={(e) => setFilterMarketplace(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Todos os canais</option>
            {Object.entries(MARKETPLACE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Todas as prioridades</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>

        {/* Barra de ações em lote */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl">
            <span className="text-sm font-medium text-teal-700">
              {selected.size} task{selected.size !== 1 ? 's' : ''} selecionada{selected.size !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setShowBatchAssign(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition"
            >
              <CheckCircle className="w-4 h-4" />
              Aprovar selecionadas
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm text-teal-600 hover:underline"
            >
              Limpar seleção
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Grupos de tasks */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-6">
            {/* Selecionar todos */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 accent-teal-600 cursor-pointer"
              />
              <span className="text-sm text-gray-500">Selecionar todos ({filtered.length})</span>
            </div>

            {Object.entries(grouped).map(([groupName, groupTasks]) => (
              <div key={groupName}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                  {groupName}
                </p>
                <div className="space-y-2">
                  {groupTasks.map((task) => (
                    <TaskApprovalCard
                      key={task.id}
                      task={task}
                      selected={selected.has(task.id)}
                      onToggleSelect={toggleSelect}
                      onApproved={removeTask}
                      onRejected={removeTask}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhuma task pendente</p>
            <p className="text-gray-400 text-sm mt-1">
              Quando os agentes gerarem recomendações, elas aparecerão aqui para aprovação
            </p>
          </div>
        )}
      </div>
    </>
  );
}
