'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { ScoreBadge } from './ScoreBadge';
import type { ListingAnalysis } from '@lib/types/products';

interface AnalysisHistoryProps {
  analyses: ListingAnalysis[];
}

export function AnalysisHistory({ analyses }: AnalysisHistoryProps) {
  const [expanded, setExpanded] = useState<string | null>(analyses[0]?.id ?? null);

  if (!analyses.length) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Histórico de análises ({analyses.length})
      </p>
      {analyses.map((a) => (
        <div key={a.id} className="border border-gray-100 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === a.id ? null : a.id)}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition text-sm"
          >
            <div className="flex items-center gap-2">
              <ScoreBadge score={a.score} size="sm" />
              <span className="text-gray-500 text-xs">
                {format(new Date(a.analyzed_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            {expanded === a.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expanded === a.id && (
            <div className="px-4 py-3 space-y-3">
              <p className="text-sm text-gray-700">{a.summary}</p>

              {a.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">Pontos fortes</p>
                  <ul className="space-y-1">
                    {a.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-gray-600">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {a.weaknesses.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1">A melhorar</p>
                  <ul className="space-y-1">
                    {a.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-gray-600">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
