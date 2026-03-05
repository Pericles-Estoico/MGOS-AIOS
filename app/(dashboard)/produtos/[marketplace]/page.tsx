'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, RefreshCw, Loader, Plus } from 'lucide-react';
import type { Marketplace } from '@lib/types/products';
import { MARKETPLACE_LABELS, getScoreLevel } from '@lib/types/products';

// ─── tipos ───────────────────────────────────────────────────────────────────

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
  listing_analyses?: ListingAnalysis[];
}

interface ProductWithListings {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  description: string | null;
  product_listings?: FullListing[];
}

// ─── constantes ──────────────────────────────────────────────────────────────

const MARKETPLACE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string; tab: string }> = {
  shopee:       { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', tab: 'bg-orange-600' },
  shein:        { bg: 'bg-pink-50',    text: 'text-pink-700',   border: 'border-pink-200',   dot: 'bg-pink-500',   tab: 'bg-pink-600' },
  mercadolivre: { bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500', tab: 'bg-yellow-600' },
  amazon:       { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500',  tab: 'bg-amber-600' },
  tiktokshop:   { bg: 'bg-gray-900',   text: 'text-white',      border: 'border-gray-700',   dot: 'bg-white',      tab: 'bg-gray-800' },
  kaway:        { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500',   tab: 'bg-blue-600' },
};

const SCORE_COLORS: Record<string, string> = {
  low: 'text-red-600', medium: 'text-yellow-600', high: 'text-green-600',
};

const VALID_MARKETPLACES = ['shopee', 'shein', 'mercadolivre', 'amazon', 'tiktokshop', 'kaway'];

// ─── componente ──────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const { marketplace } = useParams<{ marketplace: string }>();
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithListings[]>([]);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState<string | null>(null);

  const mp = marketplace as Marketplace;
  const style = MARKETPLACE_STYLES[mp];
  const label = MARKETPLACE_LABELS[mp as Marketplace] ?? marketplace;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?include=listings');
      if (!res.ok) throw new Error('Erro ao carregar');
      const { products: data } = await res.json();
      setProducts(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!VALID_MARKETPLACES.includes(marketplace)) {
      router.push('/produtos');
      return;
    }
    fetchProducts();
  }, [marketplace, fetchProducts, router]);

  // Filtra somente listings deste marketplace
  const entries = products.flatMap((p) =>
    (p.product_listings ?? [])
      .filter((l) => l.marketplace === mp)
      .map((l) => ({ product: p, listing: l }))
  );

  async function handleReanalyze(productId: string, listingId: string) {
    setReanalyzing(listingId);
    try {
      await fetch(`/api/products/${productId}/listings/${listingId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setTimeout(() => fetchProducts(), 8000);
    } catch (err) {
      console.error(err);
    } finally {
      setReanalyzing(null);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/produtos')}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className={`flex items-center gap-3 flex-1 px-4 py-3 rounded-xl border ${style?.bg} ${style?.border}`}>
          <span className={`w-3.5 h-3.5 rounded-full ${style?.dot}`} />
          <div>
            <h1 className={`text-xl font-bold ${style?.text}`}>{label}</h1>
            <p className={`text-xs opacity-70 ${style?.text}`}>
              {loading ? '...' : `${entries.length} produto${entries.length !== 1 ? 's' : ''} neste canal`}
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/produtos')}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
        >
          <Plus className="w-4 h-4" />
          Adicionar produto
        </button>
      </div>

      {/* Outros canais — navegação rápida */}
      <div className="flex gap-2 flex-wrap mb-6">
        {VALID_MARKETPLACES.filter((m) => m !== marketplace).map((m) => {
          const s = MARKETPLACE_STYLES[m];
          return (
            <button
              key={m}
              onClick={() => router.push(`/produtos/${m}`)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition hover:shadow-sm ${s.bg} ${s.border} ${s.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {MARKETPLACE_LABELS[m as Marketplace]}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Lista de produtos */}
      {!loading && entries.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <p className={`text-2xl mb-3`}>{label}</p>
          <p className="text-gray-500">Nenhum produto cadastrado neste canal.</p>
          <button
            onClick={() => router.push('/produtos')}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
          >
            Ir para produtos
          </button>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map(({ product, listing }) => {
            const isAnalyzing = reanalyzing === listing.id || listing.status === 'analyzing';
            const latestAnalysis = listing.listing_analyses?.[0] ?? null;
            const scoreLevel = listing.listing_score !== null ? getScoreLevel(listing.listing_score) : null;

            return (
              <div key={listing.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
                {/* Produto */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {product.brand && <span className="text-xs text-gray-400">{product.brand}</span>}
                      {product.category && <span className="text-xs text-gray-400">· {product.category}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleReanalyze(product.id, listing.id)}
                    disabled={isAnalyzing}
                    className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition disabled:opacity-40 shrink-0"
                    title="Reanalisar"
                  >
                    {isAnalyzing
                      ? <Loader className="w-4 h-4 animate-spin" />
                      : <RefreshCw className="w-4 h-4" />}
                  </button>
                </div>

                {/* Título do listing */}
                {listing.title && (
                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">{listing.title}</p>
                )}

                {/* Preço + Score */}
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  {listing.price && (
                    <span className="text-lg font-bold text-teal-600">{listing.price}</span>
                  )}
                  {listing.listing_score !== null ? (
                    <span className={`text-sm font-semibold ${scoreLevel ? SCORE_COLORS[scoreLevel] : ''}`}>
                      Score: {listing.listing_score}
                    </span>
                  ) : !isAnalyzing ? (
                    <span className="text-xs text-gray-400 italic">Score não calculado</span>
                  ) : null}
                  {isAnalyzing && (
                    <span className="text-xs text-blue-600">Analisando...</span>
                  )}
                </div>

                {/* URL */}
                {listing.url && (
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline"
                  >
                    Ver no marketplace <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {/* Análise */}
                {latestAnalysis?.summary && !isAnalyzing && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 line-clamp-2">{latestAnalysis.summary}</p>
                    {latestAnalysis.weaknesses?.length > 0 && (
                      <ul className="mt-1">
                        {latestAnalysis.weaknesses.slice(0, 2).map((w, i) => (
                          <li key={i} className="text-xs text-red-500">· {w}</li>
                        ))}
                      </ul>
                    )}
                    {latestAnalysis.strengths?.length > 0 && (
                      <ul className="mt-1">
                        {latestAnalysis.strengths.slice(0, 1).map((s, i) => (
                          <li key={i} className="text-xs text-green-600">✓ {s}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
