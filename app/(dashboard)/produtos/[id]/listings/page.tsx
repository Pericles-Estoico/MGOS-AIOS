'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, LayoutList } from 'lucide-react';
import { ListingForm } from '@/components/products/ListingForm';
import { ListingCard } from '@/components/products/ListingCard';
import type { ProductListingWithAnalyses, Marketplace } from '@lib/types/products';

export default function ListingsPage() {
  const { id: productId } = useParams<{ id: string }>();
  const router = useRouter();

  const [productName, setProductName] = useState('');
  const [listings, setListings] = useState<ProductListingWithAnalyses[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const [listingsRes, productRes] = await Promise.all([
        fetch(`/api/products/${productId}/listings`),
        fetch(`/api/products`),
      ]);

      if (listingsRes.ok) {
        const { listings: data } = await listingsRes.json();
        setListings(data ?? []);
      }
      if (productRes.ok) {
        const { products } = await productRes.json();
        const current = products?.find((p: { id: string; name: string }) => p.id === productId);
        if (current) setProductName(current.name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  async function handleAdd(data: { marketplace: Marketplace; url: string; imageBase64?: string; imageMediaType?: string }) {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { listing } = await res.json();
      setListings((prev) => [{ ...listing, analyses: [] }, ...prev]);
      setAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleDeleted(id: string) {
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  function handleReanalyzed(updated: ProductListingWithAnalyses) {
    setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/produtos')}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-sm text-gray-400">Produto</p>
          <h1 className="text-xl font-bold text-gray-900 truncate">{productName || '...'}</h1>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
        >
          <Plus className="w-4 h-4" />
          Adicionar canal
        </button>
      </div>

      {/* Formulário de adição */}
      {adding && (
        <div className="bg-white rounded-xl border border-teal-200 shadow-sm p-5 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Novo listing</p>
          <ListingForm
            onSubmit={handleAdd}
            onCancel={() => setAdding(false)}
            loading={saving}
          />
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Lista de listings */}
      {!loading && listings.length > 0 && (
        <div className="space-y-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              productId={productId}
              onDeleted={handleDeleted}
              onReanalyzed={handleReanalyzed}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && listings.length === 0 && !adding && (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <LayoutList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhum canal adicionado</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">
            Adicione o listing deste produto em cada marketplace que você vende
          </p>
          <button
            onClick={() => setAdding(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
          >
            Adicionar primeiro canal
          </button>
        </div>
      )}
    </div>
  );
}
