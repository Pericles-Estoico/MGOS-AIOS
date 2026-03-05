'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const SETORES = [
  'Conteúdo',
  'Ads',
  'Cadastro de Produto',
  'Marketplace',
  'Relatórios',
] as const;

export type Setor = typeof SETORES[number];

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AssignModalProps {
  taskTitle: string;
  onConfirm: (setor: Setor, assignedTo?: string) => Promise<void>;
  onCancel: () => void;
}

export function AssignModal({ taskTitle, onConfirm, onCancel }: AssignModalProps) {
  const [setor, setSetor] = useState<Setor>('Marketplace');
  const [assignedTo, setAssignedTo] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setMembers(d.users ?? []))
      .catch(() => {});
  }, []);

  async function handleConfirm() {
    setSaving(true);
    try {
      await onConfirm(setor, assignedTo || undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Aprovar e encaminhar</h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">
            {taskTitle}
          </p>

          {/* Setor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setor responsável <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SETORES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSetor(s)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition text-left ${
                    setor === s
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Responsável individual (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsável individual
              <span className="text-gray-400 font-normal ml-1">(opcional)</span>
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Apenas o setor</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 p-5 pt-0">
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:bg-gray-300 transition"
          >
            {saving ? 'Aprovando...' : 'Aprovar e encaminhar'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
