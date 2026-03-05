'use client';

import { useState } from 'react';
import { ExternalLink, RefreshCw, Trash2, Loader } from 'lucide-react';
import { ScoreBadge } from './ScoreBadge';
import { AnalysisHistory } from './AnalysisHistory';
import { MARKETPLACE_LABELS, type ProductListingWithAnalyses } from '@lib/types/products';

interface ListingCardProps {
  listing: ProductListingWithAnalyses;
  productId: string;
  onDeleted: (id: string) => void;
  onReanalyzed: (updated: ProductListingWithAnalyses) => void;
}

const STATUS_LABEL: Record<string, string> = {
  active:    'Ativo',
  analyzing: 'Analisando...',
  inactive:  'Inativo',
};

export function ListingCard({ listing, productId, onDeleted, onReanalyzed }: ListingCardProps) {
  const [analyzing, setAnalyzing] = useState(listing.status === 'analyzing');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const analyses = (listing as ProductListingWithAnalyses & { listing_analyses?: typeof listing.analyses }).listing_analyses ?? listing.analyses ?? [];

  async function handleReanalyze() {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/products/${productId}/listings/${listing.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { analysis } = await res.json();
      onReanalyzed({
        ...listing,
        listing_score: analysis.score,
        status: 'active',
        analyses: [
          { id: analysis.id, listing_id: listing.id, score: analysis.score, summary: analysis.summary, strengths: analysis.strengths, weaknesses: analysis.weaknesses, analysis_data: {}, analyzed_at: new Date().toISOString() },
          ...analyses,
        ],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${productId}/listings/${listing.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      onDeleted(listing.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">
              {MARKETPLACE_LABELS[listing.marketplace] ?? listing.marketplace}
            </span>
            <ScoreBadge score={listing.listing_score} size="sm" />
            {analyzing && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                <Loader className="w-3 h-3 animate-spin" />
                Analisando...
              </span>
            )}
            {!analyzing && listing.status === 'inactive' && (
              <span className="text-xs text-gray-400">{STATUS_LABEL[listing.status]}</span>
            )}
          </div>

          {listing.title && (
            <p className="text-sm text-gray-600 mt-1 truncate">{listing.title}</p>
          )}
          {listing.price && (
            <p className="text-lg font-bold text-teal-600 mt-1">{listing.price}</p>
          )}
          {listing.url && (
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline mt-1"
            >
              Ver no marketplace <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleReanalyze}
            disabled={analyzing}
            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition disabled:opacity-40"
            title="Reanalisar"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Remover listing"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Último resultado da análise */}
      {analyses.length > 0 && !analyzing && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2">{analyses[0].summary}</p>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-teal-600 hover:underline mt-1"
          >
            {showHistory ? 'Ocultar histórico' : `Ver histórico (${analyses.length} análise${analyses.length > 1 ? 's' : ''})`}
          </button>
          {showHistory && <AnalysisHistory analyses={analyses} />}
        </div>
      )}

      {confirmDelete && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 mb-2">Remover este listing e todas as suas análises?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition"
            >
              {deleting ? 'Removendo...' : 'Confirmar'}
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
