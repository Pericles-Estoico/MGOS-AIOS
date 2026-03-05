'use client';

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { DocumentProductCard } from '@lib/parsers/document-parser';

interface SpreadsheetResult {
  type: 'spreadsheet';
  totalRows: number;
  productsCreated: number;
  listingsCreated: number;
  analysisQueued: number;
  errors: Array<{ row: number | string; message: string }>;
}

interface DocumentResult {
  type: 'document';
  cards: DocumentProductCard[];
}

type ImportResultData = SpreadsheetResult | DocumentResult;

interface ImportResultProps {
  result: ImportResultData;
  onClose: () => void;
}

export function ImportResult({ result, onClose }: ImportResultProps) {
  if (result.type === 'document') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-teal-600">
          <CheckCircle className="w-5 h-5" />
          <p className="font-medium text-sm">Texto extraído com sucesso</p>
        </div>
        <p className="text-sm text-gray-600">
          A IA identificou <span className="font-semibold">{result.cards.length}</span> produto(s) no documento.
          Revise abaixo e salve os que quiser.
        </p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {result.cards.map((card, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <p className="font-medium text-gray-900 text-sm">{card.nome}</p>
              <div className="flex gap-3 mt-1 text-xs text-gray-500">
                {card.categoria && <span>Categoria: {card.categoria}</span>}
                {card.marca && <span>Marca: {card.marca}</span>}
              </div>
              {card.descricao && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{card.descricao}</p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition"
        >
          Fechar
        </button>
      </div>
    );
  }

  const hasErrors = result.errors.length > 0;

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-teal-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-teal-600">{result.productsCreated}</p>
          <p className="text-xs text-teal-700 mt-1">Produtos criados</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{result.listingsCreated}</p>
          <p className="text-xs text-blue-700 mt-1">Listings criados</p>
        </div>
        {result.analysisQueued > 0 && (
          <div className="bg-purple-50 rounded-lg p-3 text-center col-span-1">
            <p className="text-2xl font-bold text-purple-600">{result.analysisQueued}</p>
            <p className="text-xs text-purple-700 mt-1">Analises em fila</p>
          </div>
        )}
        {hasErrors && (
          <div className="bg-red-50 rounded-lg p-3 text-center col-span-1">
            <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
            <p className="text-xs text-red-700 mt-1">Erros</p>
          </div>
        )}
      </div>

      {/* Status geral */}
      {result.productsCreated > 0 ? (
        <div className="flex items-center gap-2 text-teal-600">
          <CheckCircle className="w-5 h-5" />
          <p className="text-sm font-medium">Import concluído!</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-5 h-5" />
          <p className="text-sm font-medium">Nenhum produto foi importado.</p>
        </div>
      )}

      {/* Erros detalhados */}
      {hasErrors && (
        <div className="border border-red-200 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
          <div className="flex items-center gap-1 text-red-600 mb-2">
            <AlertCircle className="w-4 h-4" />
            <p className="text-xs font-semibold">Erros por linha:</p>
          </div>
          {result.errors.map((err, i) => (
            <p key={i} className="text-xs text-red-600">
              Linha {err.row}: {err.message}
            </p>
          ))}
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full px-4 py-2 text-sm bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition"
      >
        Ver produtos importados
      </button>
    </div>
  );
}
