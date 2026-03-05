'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Package, Upload, LayoutGrid, LayoutList, ExternalLink, RefreshCw, Loader } from 'lucide-react';
import type { ProductWithStats, Marketplace } from '@lib/types/products';
import { MARKETPLACE_LABELS, getScoreLevel } from '@lib/types/products';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductCard } from '@/components/products/ProductCard';
import { ScoreBadge } from '@/components/products/ScoreBadge';

// ─── tipos internos ──────────────────────────────────────────────────────────

interface ListingAnalysis {
  id: string;
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  analyzed_at: string;
}

interface FullListing {
  id: string;
  product_id: string;
  marketplace: Marketplace;
  url: string | null;
  title: string | null;
  price: string | null;
  image_url: string | null;
  listing_score: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  listing_analyses?: ListingAnalysis[];
}

interface ProductWithListings extends ProductWithStats {
  product_listings?: FullListing[];
}

// ─── helpers ────────────────────────────────────────────────────────────────

const MARKETPLACE_ORDER: Marketplace[] = [
  'shopee', 'shein', 'mercadolivre', 'amazon', 'tiktokshop', 'kaway',
];

const MARKETPLACE_COLORS: Record<Marketplace, { bg: string; text: string; border: string; dot: string }> = {
  shopee:       { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  shein:        { bg: 'bg-pink-50',    text: 'text-pink-700',   border: 'border-pink-200',   dot: 'bg-pink-500' },
  mercadolivre: { bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  amazon:       { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500' },
  tiktokshop:   { bg: 'bg-gray-900',   text: 'text-white',      border: 'border-gray-700',   dot: 'bg-white' },
  kaway:        { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500' },
};

const SCORE_COLORS: Record<string, string> = {
  low:    'text-red-600',
  medium: 'text-yellow-600',
  high:   'text-green-600',
};

// ─── componente: card de listing por marketplace ─────────────────────────────

function MarketplaceListingCard({
  product,
  listing,
  onReanalyze,
}: {
  product: ProductWithListings;
  listing: FullListing;
  onReanalyze: (productId: string, listingId: string) => void;
}) {
  const [analyzing, setAnalyzing] = useState(listing.status === 'analyzing');
  const latestAnalysis = listing.listing_analyses?.[0] ?? null;
  const scoreLevel = listing.listing_score !== null ? getScoreLevel(listing.listing_score) : null;

  async function handleReanalyze() {
    setAnalyzing(true);
    try {
      await fetch(`/api/products/${product.id}/listings/${listing.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      onReanalyze(product.id, listing.id);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
      {/* Produto */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{product.name}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {product.brand && (
              <span className="text-xs text-gray-400">{product.brand}</span>
            )}
            {product.category && (
              <span className="text-xs text-gray-400">· {product.category}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {analyzing ? (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600 px-2 py-1">
              <Loader className="w-3 h-3 animate-spin" /> Analisando...
            </span>
          ) : (
            <button
              onClick={handleReanalyze}
              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition"
              title="Reanalisar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Listing title + price */}
      {listing.title && (
        <p className="text-sm text-gray-700 line-clamp-2 mb-2">{listing.title}</p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {listing.price && (
          <span className="text-base font-bold text-teal-600">{listing.price}</span>
        )}
        {listing.listing_score !== null && (
          <span className={`text-sm font-semibold ${scoreLevel ? SCORE_COLORS[scoreLevel] : ''}`}>
            Score: {listing.listing_score}
          </span>
        )}
        {!listing.listing_score && !analyzing && (
          <span className="text-xs text-gray-400 italic">Score não calculado</span>
        )}
      </div>

      {/* URL */}
      {listing.url && (
        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline mt-2"
        >
          Ver no marketplace <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {/* Último resumo de análise */}
      {latestAnalysis?.summary && !analyzing && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 line-clamp-2">{latestAnalysis.summary}</p>
          {latestAnalysis.weaknesses?.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {latestAnalysis.weaknesses.slice(0, 2).map((w, i) => (
                <li key={i} className="text-xs text-red-500">· {w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── componente principal ────────────────────────────────────────────────────

export default function ProdutosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithListings[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'marketplace' | 'product'>('marketplace');
  const [activeTab, setActiveTab] = useState<Marketplace | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?include=listings');
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

  // Detecta marketplaces com listings
  const marketplacesWithListings = MARKETPLACE_ORDER.filter((mp) =>
    products.some((p) =>
      (p.product_listings ?? []).some((l) => l.marketplace === mp)
    )
  );

  // Seta aba ativa ao carregar
  useEffect(() => {
    if (!activeTab && marketplacesWithListings.length > 0) {
      setActiveTab(marketplacesWithListings[0]);
    }
  }, [marketplacesWithListings, activeTab]);

  // Produtos+listings para a aba ativa
  const listingsForTab = activeTab
    ? products.flatMap((p) =>
        (p.product_listings ?? [])
          .filter((l) => l.marketplace === activeTab)
          .map((l) => ({ product: p, listing: l }))
      )
    : [];

  async function handleCreate(data: { name: string; category: string; brand: string; description: string }) {
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchProducts();
      setCreating(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleUpdated(updated: ProductWithStats) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
  }

  function handleDeleted(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleReanalyze(productId: string, listingId: string) {
    // Marca listing como analyzing e recarrega após um delay
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          product_listings: (p.product_listings ?? []).map((l) =>
            l.id === listingId ? { ...l, status: 'analyzing' } : l
          ),
        };
      })
    );
    setTimeout(() => fetchProducts(), 8000);
  }

  const tabColor = activeTab ? MARKETPLACE_COLORS[activeTab] : null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle de view */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('marketplace')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition ${
                view === 'marketplace'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Por marketplace"
            >
              <LayoutGrid className="w-4 h-4" />
              Por canal
            </button>
            <button
              onClick={() => setView('product')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition ${
                view === 'product'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Por produto"
            >
              <LayoutList className="w-4 h-4" />
              Por produto
            </button>
          </div>

          <button
            onClick={() => router.push('/produtos/import')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            <Upload className="w-4 h-4" />
            Importar
          </button>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
          >
            <Plus className="w-4 h-4" />
            Novo produto
          </button>
        </div>
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

      {/* Loading skeleton */}
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

      {/* ── VIEW: POR MARKETPLACE ───────────────────────────────────────────── */}
      {!loading && view === 'marketplace' && (
        <>
          {marketplacesWithListings.length === 0 ? (
            <EmptyState onNew={() => setCreating(true)} />
          ) : (
            <>
              {/* Tabs de marketplace */}
              <div className="flex gap-2 flex-wrap mb-6 border-b border-gray-200 pb-0">
                {marketplacesWithListings.map((mp) => {
                  const c = MARKETPLACE_COLORS[mp];
                  const count = products.reduce(
                    (acc, p) => acc + (p.product_listings ?? []).filter((l) => l.marketplace === mp).length,
                    0
                  );
                  return (
                    <button
                      key={mp}
                      onClick={() => setActiveTab(mp)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition -mb-px ${
                        activeTab === mp
                          ? `border-teal-600 text-teal-700 bg-teal-50`
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                      {MARKETPLACE_LABELS[mp]}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        activeTab === mp ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Conteúdo da aba */}
              {activeTab && (
                <div>
                  {/* Cabeçalho da aba */}
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-4 ${tabColor?.bg} ${tabColor?.border}`}>
                    <span className={`w-3 h-3 rounded-full ${tabColor?.dot}`} />
                    <div>
                      <p className={`font-semibold ${tabColor?.text}`}>
                        {MARKETPLACE_LABELS[activeTab]}
                      </p>
                      <p className={`text-xs opacity-70 ${tabColor?.text}`}>
                        {listingsForTab.length} listing{listingsForTab.length !== 1 ? 's' : ''} neste canal
                      </p>
                    </div>
                  </div>

                  {listingsForTab.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">
                      Nenhum produto cadastrado neste canal ainda.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {listingsForTab.map(({ product, listing }) => (
                        <MarketplaceListingCard
                          key={listing.id}
                          product={product}
                          listing={listing}
                          onReanalyze={handleReanalyze}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── VIEW: POR PRODUTO ───────────────────────────────────────────────── */}
      {!loading && view === 'product' && (
        <>
          {products.length === 0 && !creating ? (
            <EmptyState onNew={() => setCreating(true)} />
          ) : (
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
        </>
      )}
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 font-medium">Nenhum produto ainda</p>
      <p className="text-gray-400 text-sm mt-1 mb-4">
        Crie seu primeiro produto e adicione listings por canal de marketplace
      </p>
      <button
        onClick={onNew}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
      >
        Criar produto
      </button>
    </div>
  );
}
