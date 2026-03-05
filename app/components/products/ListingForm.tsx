'use client';

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { MARKETPLACE_LABELS, type Marketplace } from '@lib/types/products';

interface ListingFormProps {
  onSubmit: (data: {
    marketplace: Marketplace;
    url: string;
    imageBase64?: string;
    imageMediaType?: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const MARKETPLACES = Object.entries(MARKETPLACE_LABELS) as [Marketplace, string][];

export function ListingForm({ onSubmit, onCancel, loading }: ListingFormProps) {
  const [marketplace, setMarketplace] = useState<Marketplace>('shopee');
  const [url, setUrl] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [imageMediaType, setImageMediaType] = useState<string | undefined>();
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Imagem muito grande. Máximo 5MB.'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o prefixo "data:image/...;base64,"
      const base64 = result.split(',')[1];
      setImageBase64(base64);
      setImageMediaType(file.type);
      setImagePreview(result);
      setError('');
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() && !imageBase64) {
      setError('Informe a URL pública ou faça upload de uma imagem (ou ambos)');
      return;
    }
    setError('');
    await onSubmit({ marketplace, url: url.trim(), imageBase64, imageMediaType });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Marketplace */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Canal <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {MARKETPLACES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMarketplace(value)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${
                marketplace === value
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL pública do listing
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://shopee.com.br/produto-..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          disabled={loading}
        />
        <p className="text-xs text-gray-400 mt-1">
          Cole a URL pública da página de vendas
        </p>
      </div>

      {/* Imagem */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Screenshot / Imagem do listing
          <span className="text-gray-400 font-normal ml-1">(opcional, melhora a análise)</span>
        </label>
        {imagePreview ? (
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-32 rounded-lg object-cover border border-gray-200" />
            <button
              type="button"
              onClick={() => { setImageBase64(undefined); setImageMediaType(undefined); setImagePreview(undefined); }}
              className="absolute -top-2 -right-2 p-1 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-red-50"
            >
              <X className="w-3 h-3 text-red-500" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-teal-400 hover:text-teal-600 transition"
          >
            <Upload className="w-4 h-4" />
            Selecionar imagem (JPG, PNG, WebP — máx 5MB)
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        A análise AI será disparada automaticamente ao salvar.
        Se o marketplace bloquear o acesso à URL, a análise usa apenas a imagem.
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:bg-gray-300 transition"
        >
          {loading ? 'Salvando e analisando...' : 'Adicionar listing'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
