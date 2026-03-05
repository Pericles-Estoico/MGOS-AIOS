'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Package } from 'lucide-react';
import type { ProductWithStats } from '@lib/types/products';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductCard } from '@/components/products/ProductCard';

export default function ProdutosPage() {
  const [products, setProducts] = useState<ProductWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Erro ao carregar produtos');
      const { products: data } = await res.json();
      setProducts(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleCreate(data: { name: string; category: string; brand: string; description: string }) {
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { product } = await res.json();
      setProducts((prev) => [{ ...product, listings_count: 0, avg_score: null }, ...prev]);
      setCreating(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleUpdated(updated: ProductWithStats) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function handleDeleted(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Cadastre produtos e gerencie seus listings por canal de marketplace
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
        >
          <Plus className="w-4 h-4" />
          Novo produto
        </button>
      </div>

      {/* Formulário de criação */}
      {creating && (
        <div className="bg-white rounded-xl border border-teal-200 shadow-sm p-5 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Novo produto</p>
          <ProductForm
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
            loading={saving}
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {!loading && products.length > 0 && (
        <div className="space-y-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && !creating && (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhum produto ainda</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">
            Crie seu primeiro produto e adicione listings por canal de marketplace
          </p>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
          >
            Criar produto
          </button>
        </div>
      )}
    </div>
  );
}
