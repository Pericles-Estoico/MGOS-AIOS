'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { ImportPreview } from '@/components/products/ImportPreview';
import { ImportResult } from '@/components/products/ImportResult';
import type { ImportRow } from '@lib/parsers/spreadsheet-parser';
import type { DocumentProductCard } from '@lib/parsers/document-parser';

type Stage = 'upload' | 'preview' | 'result';

interface PreviewData {
  rows: ImportRow[];
  total: number;
  file: File;
}

interface ResultData {
  type: 'spreadsheet' | 'document';
  totalRows?: number;
  productsCreated?: number;
  listingsCreated?: number;
  analysisQueued?: number;
  errors?: Array<{ row: number | string; message: string }>;
  cards?: DocumentProductCard[];
}

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const ACCEPTED = '.csv,.xlsx,.xls,.pdf,.docx,.doc';

  async function handleFileSelect(file: File) {
    setError('');
    setLoading(true);

    const fileName = file.name.toLowerCase();
    const isDocument = fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc');

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (!isDocument) {
        // Planilha: busca preview primeiro
        formData.append('preview', 'true');
        const res = await fetch('/api/products/import', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPreview({ rows: data.preview, total: data.total, file });
        setStage('preview');
      } else {
        // Documento: envia direto para processamento AI
        const res = await fetch('/api/products/import', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResult(data);
        setStage('result');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmImport() {
    if (!preview) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', preview.file);
      const res = await fetch('/api/products/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStage('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar');
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push('/produtos')}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Importar Produtos</h1>
          <p className="text-gray-500 text-sm">CSV, Excel, PDF ou DOCX — até 50 produtos por vez</p>
        </div>
      </div>

      {/* Upload stage */}
      {stage === 'upload' && (
        <div className="space-y-6">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition"
          >
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">
              {loading ? 'Processando...' : 'Clique ou arraste o arquivo aqui'}
            </p>
            <p className="text-gray-400 text-sm mt-1">CSV, XLSX, PDF, DOCX</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* Formatos suportados */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-3 bg-white rounded-lg border border-gray-100 p-4">
              <FileSpreadsheet className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Planilha</p>
                <p className="text-xs text-gray-500 mt-0.5">CSV ou XLSX com colunas: nome, categoria, marca, marketplace, url, preco</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white rounded-lg border border-gray-100 p-4">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Documento</p>
                <p className="text-xs text-gray-500 mt-0.5">PDF ou DOCX — a IA identifica os produtos automaticamente</p>
              </div>
            </div>
          </div>

          {/* Download template */}
          <a
            href="/templates/produtos-template.csv"
            download
            className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            <Download className="w-4 h-4" />
            Baixar template CSV
          </a>
        </div>
      )}

      {/* Preview stage */}
      {stage === 'preview' && preview && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Preview dos dados</h2>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
          )}
          <ImportPreview
            rows={preview.rows}
            total={preview.total}
            onConfirm={handleConfirmImport}
            onCancel={() => { setStage('upload'); setPreview(null); }}
            loading={loading}
          />
        </div>
      )}

      {/* Result stage */}
      {stage === 'result' && result && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Resultado do import</h2>
          <ImportResult
            result={result as Parameters<typeof ImportResult>[0]['result']}
            onClose={() => router.push('/produtos')}
          />
        </div>
      )}
    </div>
  );
}
