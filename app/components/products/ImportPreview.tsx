'use client';

import type { ImportRow } from '@lib/parsers/spreadsheet-parser';

interface ImportPreviewProps {
  rows: ImportRow[];
  total: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ImportPreview({ rows, total, onConfirm, onCancel, loading }: ImportPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{rows.length}</span> de{' '}
          <span className="font-medium">{total}</span> linhas encontradas
        </p>
        {total > 50 && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
            Limite: 50 produtos por import
          </span>
        )}
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Nome', 'Categoria', 'Marca', 'Marketplace', 'URL', 'Preço'].map((col) => (
                <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((row) => (
              <tr key={row._rowIndex}>
                <td className="px-3 py-2 font-medium text-gray-900 max-w-[180px] truncate">{row.nome}</td>
                <td className="px-3 py-2 text-gray-500">{row.categoria || '—'}</td>
                <td className="px-3 py-2 text-gray-500">{row.marca || '—'}</td>
                <td className="px-3 py-2 text-gray-500 capitalize">{row.marketplace || '—'}</td>
                <td className="px-3 py-2 text-gray-400 max-w-[160px] truncate text-xs">{row.url || '—'}</td>
                <td className="px-3 py-2 text-gray-500">{row.preco || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50"
        >
          {loading ? 'Importando...' : `Confirmar import (${Math.min(total, 50)} produtos)`}
        </button>
      </div>
    </div>
  );
}
