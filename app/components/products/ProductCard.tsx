'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutList, Pencil, Trash2, Tag, Building2 } from 'lucide-react';
import type { ProductWithStats } from '@lib/types/products';
import { getScoreLevel } from '@lib/types/products';
import { ProductForm } from './ProductForm';

interface ProductCardProps {
  product: ProductWithStats;
  onUpdated: (p: ProductWithStats) => void;
  onDeleted: (id: string) => void;
}

const SCORE_COLORS: Record<string, string> = {
  low:    'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-green-100 text-green-700',
};

export function ProductCard({ product, onUpdated, onDeleted }: ProductCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleEdit(data: { name: string; category: string; brand: string; description: string }) {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { product: updated } = await res.json();
      onUpdated({ ...product, ...updated });
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      onDeleted(product.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  }

  const scoreLevel = product.avg_score !== null ? getScoreLevel(product.avg_score) : null;

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-teal-200 shadow-sm p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">Editar produto</p>
        <ProductForm
          initial={product}
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>

          <div className="flex flex-wrap gap-2 mt-2">
            {product.category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                <Tag className="w-3 h-3" />
                {product.category}
              </span>
            )}
            {product.brand && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                <Building2 className="w-3 h-3" />
                {product.brand}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
          )}

          <div className="flex items-center gap-3 mt-3">
            <span className="text-sm text-gray-500">
              {product.listings_count} {product.listings_count === 1 ? 'canal' : 'canais'}
            </span>
            {scoreLevel && product.avg_score !== null && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SCORE_COLORS[scoreLevel]}`}>
                Score médio: {product.avg_score}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => router.push(`/produtos/${product.id}/listings`)}
            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition"
            title="Gerenciar listings"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditing(true)}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition"
            title="Editar produto"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Remover produto"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 mb-2">
            Remover <strong>{product.name}</strong> e todos os seus listings e análises?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition"
            >
              {loading ? 'Removendo...' : 'Confirmar remoção'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
