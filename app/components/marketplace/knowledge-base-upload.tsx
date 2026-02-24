'use client';

import { useState } from 'react';
import { Upload, X, FileText, Image, Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface KnowledgeBaseUploadProps {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export function KnowledgeBaseUpload({ onSuccess, onError }: KnowledgeBaseUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [marketplaces, setMarketplaces] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [autoGenerateTasks, setAutoGenerateTasks] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const MARKETPLACES = [
    { id: 'amazon', label: 'Amazon', icon: '🛒' },
    { id: 'mercadolivre', label: 'MercadoLivre', icon: '🎯' },
    { id: 'shopee', label: 'Shopee', icon: '🏪' },
    { id: 'shein', label: 'SHEIN', icon: '👗' },
    { id: 'tiktokshop', label: 'TikTok Shop', icon: '📱' },
    { id: 'kaway', label: 'Kaway', icon: '💎' },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const toggleMarketplace = (id: string) => {
    setMarketplaces((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleUpload = async () => {
    if (!file || marketplaces.length === 0) {
      setError('Selecione um arquivo e pelo menos um marketplace');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('marketplaces', JSON.stringify(marketplaces));
      formData.append('autoGenerateTasks', autoGenerateTasks.toString());

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + Math.random() * 30, 90));
      }, 500);

      const response = await fetch('/api/marketplace/knowledge-base/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Erro ao fazer upload');
      }

      const data = await response.json();
      setResult(data);
      setFile(null);
      setMarketplaces([]);

      if (onSuccess) {
        onSuccess(data);
      }

      // Show success for 3 seconds then reset
      setTimeout(() => {
        setResult(null);
        setUploadProgress(0);
      }, 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-8 h-8" />;

    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf') || file.type === 'application/pdf') {
      return <FileText className="w-8 h-8" />;
    }
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8" />;
    }
    return <FileText className="w-8 h-8" />;
  };

  if (result) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">Sucesso!</h3>
          <p className="text-gray-600 mt-2">{result.message}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left mb-4">
          <p className="text-sm text-gray-700">
            <strong>Arquivo:</strong> {result.entry.filename}
          </p>
          <p className="text-sm text-gray-700 mt-2">
            <strong>Marketplaces:</strong> {result.entry.marketplaces.join(', ')}
          </p>
          {result.generatedTasks.length > 0 && (
            <p className="text-sm text-green-700 mt-2 font-semibold">
              ✅ {result.generatedTasks.length} tarefas geradas e aguardando aprovação
            </p>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <p className="font-semibold text-gray-900">Insights Chave:</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {result.analysis.keyInsights.map((insight: string, i: number) => (
              <li key={i}>• {insight}</li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => setResult(null)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Fazer novo upload
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 rounded-full p-2">
          <Upload className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">NEXO Knowledge Base</h2>
          <p className="text-sm text-gray-600">Upload arquivos para NEXO aprender e otimizar</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Erro</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition mb-6 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          id="kb-file-upload"
          onChange={handleFileSelect}
          accept=".pdf,.txt,.csv,.json,.xlsx,.xls,.jpg,.jpeg,.png,.gif"
          className="hidden"
        />
        <label htmlFor="kb-file-upload" className="cursor-pointer block">
          <div className={`text-4xl mb-2 ${dragActive ? 'text-blue-600' : file ? 'text-green-600' : 'text-gray-400'}`}>
            {getFileIcon()}
          </div>
          {file ? (
            <div className="space-y-2">
              <p className="font-semibold text-green-700">{file.name}</p>
              <p className="text-sm text-green-600">{(file.size / 1024 / 1024).toFixed(2)}MB</p>
              <p className="text-xs text-green-600">Clique para alterar arquivo</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold text-gray-900">Arraste o arquivo aqui ou clique para selecionar</p>
              <p className="text-sm text-gray-600">Suporta: PDF, Imagens, Planilhas, Documentos (máx. 50MB)</p>
            </div>
          )}
        </label>
      </div>

      {/* Marketplace Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Selecionar Marketplaces para Otimização
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MARKETPLACES.map((marketplace) => (
            <button
              key={marketplace.id}
              onClick={() => toggleMarketplace(marketplace.id)}
              className={`p-3 border-2 rounded-lg transition flex items-center gap-2 ${
                marketplaces.includes(marketplace.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition ${
                  marketplaces.includes(marketplace.id)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {marketplaces.includes(marketplace.id) && (
                  <span className="text-white text-sm font-bold">✓</span>
                )}
              </div>
              <span className="text-lg">{marketplace.icon}</span>
              <span className="text-sm font-medium text-gray-900">{marketplace.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoGenerateTasks}
            onChange={(e) => setAutoGenerateTasks(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm font-medium text-gray-900">
            Gerar tarefas automaticamente para aprovação
          </span>
        </label>
        <p className="text-xs text-gray-600 mt-2 ml-7">
          Se marcado, tarefas serão criadas automaticamente (requer aprovação manual)
        </p>
      </div>

      {/* Progress Bar */}
      {uploading && uploadProgress > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Processando...</span>
            <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setFile(null);
            setMarketplaces([]);
            setError(null);
          }}
          disabled={uploading || !file}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
        >
          Limpar
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading || !file || marketplaces.length === 0}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              🚀 Upload & Análise
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-semibold mb-2">💡 Como funciona:</p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Upload de arquivo (foto, planilha, documento, PDF)</li>
          <li>2. NEXO analisa e extrai insights</li>
          <li>3. Cria instruções customizadas por marketplace</li>
          <li>4. Gera tarefas automaticamente para agentes</li>
          <li>5. Você aprova e agentes executam</li>
        </ul>
      </div>
    </div>
  );
}
