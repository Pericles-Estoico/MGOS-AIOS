'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Layers, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { GanttChart } from '@components/mvp/GanttChart';
import { FinanceiroDashboard } from '@components/mvp/FinanceiroDashboard';

const CATEGORIA_LABELS: Record<string, string> = {
  camiseta: 'Camiseta', calca: 'Calça', vestido: 'Vestido',
  conjunto: 'Conjunto', 'moda-infantil': 'Moda Infantil',
  jaqueta: 'Jaqueta', acessorio: 'Acessório',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planejado:    { label: 'Planejado',    color: 'bg-zinc-100 text-zinc-600' },
  em_andamento: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700' },
  concluido:    { label: 'Concluído',    color: 'bg-green-100 text-green-700' },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-100 text-red-600' },
};

type Tab = 'gantt' | 'financeiro';

export default function ProdutoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [costsStages, setCostsStages] = useState<any[]>([]);
  const [progresso, setProgresso] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>(
    searchParams.get('tab') === 'financeiro' ? 'financeiro' : 'gantt'
  );

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    router.replace(`/produtos/${id}?tab=${tab}`, { scroll: false });
  }

  useEffect(() => {
    async function load() {
      try {
        const [productRes, costsRes] = await Promise.all([
          fetch(`/api/mvp/products/${id}`),
          fetch(`/api/mvp/costs?product_id=${id}`),
        ]);

        if (!productRes.ok) throw new Error('Produto não encontrado');
        const productData = await productRes.json();
        setProduct(productData.product);
        setProgresso(productData.progresso ?? 0);
        setStages(productData.stages ?? []);

        if (costsRes.ok) {
          const costsData = await costsRes.json();
          setCostsStages(costsData.stages ?? []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Map stage_id → total_real for Gantt tooltip
  const costsByStage = useMemo(() => {
    const map: Record<string, number> = {};
    costsStages.forEach((s: any) => { map[s.id] = s.total_real; });
    return map;
  }, [costsStages]);

  // Grand totals for FinanceiroDashboard
  const { grandPlanejado, grandReal, costsByTipo } = useMemo(() => {
    let gp = 0;
    let gr = 0;
    const byTipo: Record<string, number> = {};
    costsStages.forEach((s: any) => {
      gp += s.total_planejado ?? 0;
      gr += s.total_real ?? 0;
      (s.costs ?? []).forEach((c: any) => {
        byTipo[c.tipo] = (byTipo[c.tipo] ?? 0) + Number(c.valor_real || 0);
      });
    });
    return { grandPlanejado: gp, grandReal: gr, costsByTipo: byTipo };
  }, [costsStages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error || 'Produto não encontrado'}</p>
          <button
            onClick={() => router.push('/produtos')}
            className="mt-3 text-sm text-zinc-500 hover:text-zinc-700"
          >
            ← Voltar para produtos
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[product.status] ?? STATUS_CONFIG.planejado;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/produtos')}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-900">{product.nome}</h1>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            {CATEGORIA_LABELS[product.categoria] ?? product.categoria}
            {' · '}{product.canal_venda}
            {' · '}{product.quantidade} un.
          </p>
        </div>
      </div>

      {/* Progresso */}
      <div className="bg-white border border-zinc-100 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-zinc-700">Progresso</span>
          <span className="font-semibold text-teal-600">{progresso}%</span>
        </div>
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href={`/produtos/${id}/etapas`}
          className="flex items-center gap-3 bg-white border border-zinc-100 hover:border-teal-300 hover:shadow-sm rounded-xl p-4 transition-all group"
        >
          <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors">
            <Layers className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800">Etapas</p>
            <p className="text-xs text-zinc-400">Gerenciar status</p>
          </div>
        </Link>

        <Link
          href={`/produtos/${id}/custos`}
          className="flex items-center gap-3 bg-white border border-zinc-100 hover:border-teal-300 hover:shadow-sm rounded-xl p-4 transition-all group"
        >
          <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors">
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800">Custos</p>
            <p className="text-xs text-zinc-400">Lançamentos</p>
          </div>
        </Link>
      </div>

      {/* Tabs: Gantt | Financeiro */}
      <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
        <div className="flex border-b border-zinc-100">
          {(['gantt', 'financeiro'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/30'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {tab === 'gantt' ? 'Gantt' : 'Financeiro'}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'gantt' && (
            <GanttChart stages={stages} costsByStage={costsByStage} />
          )}

          {activeTab === 'financeiro' && (
            <FinanceiroDashboard
              productId={id}
              quantidade={product.quantidade ?? 1}
              initialData={{
                preco_venda: product.preco_venda,
                taxa_canal: product.taxa_canal,
                prazo_repasse_dias: product.prazo_repasse_dias,
                data_venda_estimada: product.data_venda_estimada,
              }}
              grandPlanejado={grandPlanejado}
              grandReal={grandReal}
              costsByTipo={costsByTipo}
            />
          )}
        </div>
      </div>
    </div>
  );
}
