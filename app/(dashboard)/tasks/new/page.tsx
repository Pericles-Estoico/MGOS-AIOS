'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const MARKETPLACES = [
  { value: 'shopee',       label: 'Shopee',        color: 'bg-orange-100 text-orange-700' },
  { value: 'shein',        label: 'SHEIN',          color: 'bg-pink-100 text-pink-700' },
  { value: 'mercadolivre', label: 'Mercado Livre',  color: 'bg-yellow-100 text-yellow-700' },
  { value: 'amazon',       label: 'Amazon',         color: 'bg-amber-100 text-amber-700' },
  { value: 'tiktokshop',   label: 'TikTok Shop',   color: 'bg-gray-100 text-gray-700' },
  { value: 'kaway',        label: 'Kaway',          color: 'bg-blue-100 text-blue-700' },
];

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description'),
          priority: formData.get('priority'),
          due_date: formData.get('due_date') || null,
          assigned_to: formData.get('assigned_to') || null,
          marketplace: selectedMarketplace || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao criar tarefa');
        return;
      }

      router.push('/tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link href="/tasks" className="text-teal-600 hover:underline mb-6 block text-sm">
        ← Voltar para Tarefas
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Criar Nova Tarefa</h1>

      <div className="bg-white rounded-xl shadow p-6 max-w-2xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              placeholder="Título da tarefa"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              rows={3}
              placeholder="Descrição da tarefa"
            />
          </div>

          {/* Canal de marketplace (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canal / Marketplace <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedMarketplace('')}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  !selectedMarketplace
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Nenhum
              </button>
              {MARKETPLACES.map((mp) => (
                <button
                  key={mp.value}
                  type="button"
                  onClick={() => setSelectedMarketplace(mp.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition font-medium ${
                    selectedMarketplace === mp.value
                      ? `${mp.color} border-current`
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {mp.label}
                </button>
              ))}
            </div>
            {selectedMarketplace && (
              <p className="text-xs text-teal-600 mt-1.5">
                ✓ Tarefa será vinculada ao canal <strong>{MARKETPLACES.find(m => m.value === selectedMarketplace)?.label}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade <span className="text-red-500">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
              >
                <option value="">Selecione</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Vencimento
              </label>
              <input
                id="due_date"
                name="due_date"
                type="date"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-2">
              Atribuir Para <span className="text-gray-400 font-normal">(ID do usuário, opcional)</span>
            </label>
            <input
              id="assigned_to"
              name="assigned_to"
              type="text"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
              placeholder="UUID do usuário"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 transition text-sm font-medium"
            >
              {loading ? 'Criando...' : 'Criar Tarefa'}
            </button>
            <Link
              href="/tasks"
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
