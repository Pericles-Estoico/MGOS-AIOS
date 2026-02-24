'use client';

import { useEffect, useState } from 'react';
import { KnowledgeBaseUpload } from '@/components/marketplace/knowledge-base-upload';
import { Brain, BookOpen, RefreshCw, Trash2, Download } from 'lucide-react';

interface KnowledgeEntry {
  id: string;
  filename: string;
  summary: string;
  marketplaces: string[];
  uploadedAt: string;
  uploadedBy: string;
  analysis: {
    keyInsights: string[];
    recommendations: string[];
    taskTemplates: string[];
  };
}

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string | 'all'>('all');

  const fetchEntries = async () => {
    try {
      setRefreshing(true);
      let url = '/api/marketplace/knowledge-base/generate-tasks?limit=100';
      if (selectedMarketplace !== 'all') {
        url += `&marketplace=${selectedMarketplace}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [selectedMarketplace]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta entrada?')) return;

    try {
      const res = await fetch(`/api/marketplace/knowledge-base/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setEntries(entries.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleGenerateTasks = async (entry: KnowledgeEntry) => {
    try {
      const res = await fetch('/api/marketplace/knowledge-base/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledgeBaseIds: [entry.id],
          marketplaces: entry.marketplaces,
          autoApprove: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ ${data.summary.total} tarefas geradas e aguardando aprovação!`);
      }
    } catch (error) {
      alert(`❌ Erro ao gerar tarefas: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="w-12 h-12 text-blue-600 animate-bounce mx-auto mb-4" />
          <p className="text-gray-600">Carregando Knowledge Base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">📚 NEXO Knowledge Base</h1>
        </div>
        <p className="text-gray-600">Upload arquivos para NEXO aprender, analisar e otimizar seus agentes</p>
      </div>

      {/* Upload Component */}
      <KnowledgeBaseUpload onSuccess={() => fetchEntries()} />

      {/* Entries List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">📖 Entradas do Conhecimento</h2>
          <button
            onClick={() => fetchEntries()}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-700">Filtrar por Marketplace:</label>
          <div className="flex gap-2 mt-3">
            {['all', 'amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway'].map((mp) => (
              <button
                key={mp}
                onClick={() => setSelectedMarketplace(mp)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedMarketplace === mp
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mp === 'all' ? 'Todos' : mp.charAt(0).toUpperCase() + mp.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Entries Grid */}
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma entrada no knowledge base ainda</p>
            <p className="text-sm text-gray-500 mt-1">Comece fazendo upload de um arquivo acima</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{entry.filename}</h3>
                    <p className="text-sm text-gray-600 mt-1">{entry.summary}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateTasks(entry)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      Gerar Tarefas
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Marketplaces */}
                <div className="flex gap-2 mb-4">
                  {entry.marketplaces.map((mp) => (
                    <span
                      key={mp}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                    >
                      {mp}
                    </span>
                  ))}
                </div>

                {/* Key Insights */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">💡 Insights Chave:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {entry.analysis.keyInsights.map((insight, i) => (
                      <li key={i}>• {insight}</li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-900 mb-2">✅ Recomendações:</p>
                  <ul className="text-sm text-green-800 space-y-1">
                    {entry.analysis.recommendations.map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Metadata */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                  <span>Upload: {new Date(entry.uploadedAt).toLocaleString('pt-BR')}</span>
                  <span>Por: {entry.uploadedBy}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="font-bold text-purple-900 mb-3">📚 Como o Knowledge Base funciona:</h3>
        <ol className="text-sm text-purple-800 space-y-2">
          <li>1. <strong>Upload:</strong> Envie fotos, planilhas, PDFs ou documentos</li>
          <li>2. <strong>Análise:</strong> NEXO analisa e extrai insights automaticamente</li>
          <li>3. <strong>Aprendizado:</strong> Sistema cria instruções customizadas por marketplace</li>
          <li>4. <strong>Geração:</strong> Tarefas são geradas automaticamente para seus agentes</li>
          <li>5. <strong>Aprovação:</strong> Você aprova antes dos agentes executarem</li>
          <li>6. <strong>Execução:</strong> Agentes executam as tarefas com o conhecimento novo</li>
        </ol>
      </div>
    </div>
  );
}
