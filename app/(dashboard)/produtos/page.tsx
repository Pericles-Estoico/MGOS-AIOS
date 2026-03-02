'use client';

import { useState } from 'react';
import { Link2, Plus, Trash2, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface Produto {
  id: string;
  titulo: string;
  preco: string;
  imagem?: string;
  link: string;
  marketplace: 'shopee' | 'shein' | 'mercado-livre' | 'outro';
  status: 'processando' | 'sucesso' | 'erro';
  descricao?: string;
}

export default function ProdutosPage() {
  const [link, setLink] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const detectarMarketplace = (url: string) => {
    if (url.includes('shopee')) return 'shopee';
    if (url.includes('shein')) return 'shein';
    if (url.includes('mercadolivre') || url.includes('mercado-livre')) return 'mercado-livre';
    return 'outro';
  };

  const extrairDadosDoProduto = async (url: string) => {
    try {
      const response = await fetch('/api/produtos/extrair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Erro ao extrair dados');
      
      const dados = await response.json();
      return dados;
    } catch (error) {
      console.error('Erro ao extrair:', error);
      return null;
    }
  };

  const adicionarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!link.trim()) {
      setMessage('Cole um link válido');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const marketplace = detectarMarketplace(link);
      
      // Tentar extrair dados do link
      const dadosExtraidos = await extrairDadosDoProduto(link);

      const novoProduto: Produto = {
        id: Date.now().toString(),
        titulo: dadosExtraidos?.titulo || `Produto ${marketplace}`,
        preco: dadosExtraidos?.preco || 'A consultar',
        imagem: dadosExtraidos?.imagem,
        link: link.trim(),
        marketplace,
        status: 'sucesso',
        descricao: dadosExtraidos?.descricao,
      };

      setProdutos([novoProduto, ...produtos]);
      setLink('');
      setMessage('✅ Produto adicionado com sucesso!');
      
      // Criar tarefa automática
      await criarTarefaProduto(novoProduto);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erro ao adicionar produto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const criarTarefaProduto = async (produto: Produto) => {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Processar: ${produto.titulo}`,
          description: `Marketplace: ${produto.marketplace}\nLink: ${produto.link}`,
          priority: 'high',
          assigned_to: null,
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    }
  };

  const removerProduto = (id: string) => {
    setProdutos(produtos.filter((p) => p.id !== id));
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Produtos</h1>
        <p className="text-gray-600">Adicione produtos via link para processamento automático</p>
      </div>

      {/* Formulário de Adição */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <form onSubmit={adicionarProduto} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cole o link do produto
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Link2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://shopee.com.br/... ou https://shein.com/... ou https://mercadolivre.com.br/..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 font-medium transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </>
                )}
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                message.includes('✅')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.includes('✅') ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Dica:</strong> Cole links de qualquer marketplace (Shopee, Shein, Mercado Livre).
              O sistema extrairá automaticamente os dados e criará uma tarefa para processamento.
            </p>
          </div>
        </form>
      </div>

      {/* Lista de Produtos */}
      <div className="grid gap-4">
        {produtos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum produto adicionado ainda</p>
            <p className="text-gray-400 text-sm">Cole um link para começar</p>
          </div>
        ) : (
          produtos.map((produto) => (
            <div key={produto.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
              <div className="flex gap-4">
                {produto.imagem && (
                  <img
                    src={produto.imagem}
                    alt={produto.titulo}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{produto.titulo}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium capitalize">
                          {produto.marketplace}
                        </span>
                        {produto.status === 'sucesso' && (
                          <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Processado
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removerProduto(produto.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-2xl font-bold text-teal-600 mb-2">{produto.preco}</p>

                  {produto.descricao && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{produto.descricao}</p>
                  )}

                  <a
                    href={produto.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    Ver no marketplace
                    <Link2 className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
