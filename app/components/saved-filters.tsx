'use client';

import { useEffect, useState } from 'react';
import { FilterState } from './advanced-filters';

interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: FilterState;
  is_shared: boolean;
  is_default: boolean;
  created_at: string;
}

interface SavedFiltersProps {
  currentFilters: FilterState;
  onApplyFilter: (filters: FilterState) => void;
  onSaveFilter: (name: string, description?: string) => void;
}

export default function SavedFilters({
  currentFilters,
  onApplyFilter,
  onSaveFilter,
}: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedFilters();
  }, []);

  const fetchSavedFilters = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/filters?include_shared=true');
      if (res.ok) {
        const data = await res.json();
        setSavedFilters(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching saved filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      alert('Nome do filtro é obrigatório');
      return;
    }

    try {
      const res = await fetch('/api/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: filterName,
          description: filterDescription,
          filters: currentFilters,
          is_shared: false,
        }),
      });

      if (res.ok) {
        setFilterName('');
        setFilterDescription('');
        setShowSaveDialog(false);
        fetchSavedFilters();
        onSaveFilter(filterName, filterDescription);
      }
    } catch (error) {
      console.error('Error saving filter:', error);
    }
  };

  const handleDeleteFilter = async (id: string) => {
    if (!confirm('Deseja deletar este filtro?')) return;

    try {
      const res = await fetch(`/api/filters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSavedFilters();
      }
    } catch (error) {
      console.error('Error deleting filter:', error);
    }
  };

  const handleApplyFilter = (filter: SavedFilter) => {
    onApplyFilter(filter.filters);
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-600 text-sm">Carregando filtros...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          💾 Salvar Filtro Atual
        </button>
      </div>

      {showSaveDialog && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <input
            type="text"
            placeholder="Nome do filtro"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <input
            type="text"
            placeholder="Descrição (opcional)"
            value={filterDescription}
            onChange={(e) => setFilterDescription(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveFilter}
              className="flex-1 px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Salvar
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {savedFilters.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-900 uppercase px-2">
            Filtros Salvos
          </h4>
          {savedFilters.map((filter) => (
            <div
              key={filter.id}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => handleApplyFilter(filter)}
                  className="flex-1 text-left"
                >
                  <div className="text-sm font-semibold text-gray-900">
                    {filter.name}
                    {filter.is_default && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Padrão
                      </span>
                    )}
                  </div>
                  {filter.description && (
                    <div className="text-xs text-gray-600 mt-0.5">
                      {filter.description}
                    </div>
                  )}
                  {filter.is_shared && (
                    <div className="text-xs text-green-600 mt-0.5">
                      🔗 Compartilhado
                    </div>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteFilter(filter.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {savedFilters.length === 0 && !showSaveDialog && (
        <div className="text-center py-4 text-gray-600 text-xs">
          Nenhum filtro salvo ainda
        </div>
      )}
    </div>
  );
}
