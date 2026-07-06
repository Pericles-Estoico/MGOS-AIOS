'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ChevronUp, ChevronDown, ArrowLeft, Loader2 } from 'lucide-react';

const CATEGORIAS = [
  { value: 'camiseta', label: 'Camiseta' },
  { value: 'calca', label: 'Calça' },
  { value: 'vestido', label: 'Vestido' },
  { value: 'conjunto', label: 'Conjunto' },
  { value: 'moda-infantil', label: 'Moda Infantil' },
  { value: 'jaqueta', label: 'Jaqueta' },
  { value: 'acessorio', label: 'Acessório' },
];

const CANAIS = [
  { value: 'ecommerce', label: 'E-commerce próprio' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'shein', label: 'Shein' },
  { value: 'mercadolivre', label: 'Mercado Livre' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'atacado', label: 'Atacado' },
  { value: 'varejo', label: 'Varejo físico' },
];

interface TemplateStage {
  nome: string;
  ordem: number;
  duracao_dias: number;
}

interface Stage {
  nome: string;
  ordem: number;
  data_inicio_plan: string;
  data_fim_plan: string;
  duracao_dias: number;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function calculateDates(stages: TemplateStage[], startDate: string): Stage[] {
  let cursor = startDate;
  return stages.map((s) => {
    const inicio = cursor;
    const fim = addDays(cursor, s.duracao_dias - 1);
    cursor = addDays(fim, 1);
    return { nome: s.nome, ordem: s.ordem, data_inicio_plan: inicio, data_fim_plan: fim, duracao_dias: s.duracao_dias };
  });
}

function recalcOrdem(stages: Stage[]): Stage[] {
  return stages.map((s, i) => ({ ...s, ordem: i + 1 }));
}

export default function NovoProdutoPage() {
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [canalVenda, setCanalVenda] = useState('ecommerce');
  const [quantidade, setQuantidade] = useState(1);
  const [dataInicio, setDataInicio] = useState('');
  const [stages, setStages] = useState<Stage[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  // Carrega template ao trocar categoria
  useEffect(() => {
    if (!categoria) { setStages([]); return; }

    async function loadTemplate() {
      setLoadingTemplate(true);
      try {
        const res = await fetch('/api/mvp/templates');
        const { templates } = await res.json();
        const tpl = templates.find((t: any) => t.categoria === categoria);
        if (tpl) {
          const base = dataInicio || new Date().toISOString().split('T')[0];
          setStages(calculateDates(tpl.stages, base));
        }
      } catch {
        setStages([]);
      } finally {
        setLoadingTemplate(false);
      }
    }

    loadTemplate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  // Recalcula datas ao mudar data de início
  function handleDataInicioChange(val: string) {
    setDataInicio(val);
    if (stages.length > 0 && val) {
      const durations = stages.map((s) => s.duracao_dias);
      let cursor = val;
      setStages(stages.map((s, i) => {
        const inicio = cursor;
        const fim = addDays(cursor, durations[i] - 1);
        cursor = addDays(fim, 1);
        return { ...s, data_inicio_plan: inicio, data_fim_plan: fim };
      }));
    }
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...stages];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setStages(recalcOrdem(next));
  }

  function moveDown(index: number) {
    if (index === stages.length - 1) return;
    const next = [...stages];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setStages(recalcOrdem(next));
  }

  function removeStage(index: number) {
    const next = stages.filter((_, i) => i !== index);
    setStages(recalcOrdem(next));
  }

  function addStage() {
    const lastFim = stages.at(-1)?.data_fim_plan;
    const inicio = lastFim ? addDays(lastFim, 1) : (dataInicio || new Date().toISOString().split('T')[0]);
    const fim = addDays(inicio, 0);
    setStages([...stages, {
      nome: '',
      ordem: stages.length + 1,
      data_inicio_plan: inicio,
      data_fim_plan: fim,
      duracao_dias: 1,
    }]);
  }

  function updateStageName(index: number, nome: string) {
    setStages(stages.map((s, i) => i === index ? { ...s, nome } : s));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Nome é obrigatório';
    if (!categoria) e.categoria = 'Selecione uma categoria';
    if (!canalVenda) e.canal_venda = 'Selecione um canal';
    if (quantidade < 1) e.quantidade = 'Quantidade deve ser maior que 0';
    if (!dataInicio) e.data_inicio_plan = 'Data de início é obrigatória';
    if (stages.length === 0) e.stages = 'Adicione ao menos uma etapa';
    if (stages.some((s) => !s.nome.trim())) e.stages = 'Todas as etapas precisam de um nome';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/mvp/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          categoria,
          canal_venda: canalVenda,
          quantidade,
          data_inicio_plan: dataInicio,
          stages: stages.map((s) => ({
            nome: s.nome,
            data_inicio_plan: s.data_inicio_plan,
            data_fim_plan: s.data_fim_plan,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setServerError(data.error ?? 'Erro ao salvar produto');
        return;
      }

      router.push('/produtos');
    } catch {
      setServerError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Novo Produto</h1>
          <p className="text-sm text-zinc-500">Preencha os dados e as etapas de produção</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Dados do produto */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">Dados do produto</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="nome">
                Nome do produto <span className="text-red-500">*</span>
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Camiseta Básica P/M/G"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition ${
                  errors.nome ? 'border-red-400' : 'border-zinc-200'
                }`}
              />
              {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome}</p>}
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="categoria">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition ${
                  errors.categoria ? 'border-red-400' : 'border-zinc-200'
                }`}
              >
                <option value="">Selecionar categoria...</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.categoria && <p className="text-xs text-red-500 mt-1">{errors.categoria}</p>}
            </div>

            {/* Canal de venda */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="canal_venda">
                Canal de venda <span className="text-red-500">*</span>
              </label>
              <select
                id="canal_venda"
                value={canalVenda}
                onChange={(e) => setCanalVenda(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              >
                {CANAIS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="quantidade">
                Quantidade (unidades) <span className="text-red-500">*</span>
              </label>
              <input
                id="quantidade"
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition ${
                  errors.quantidade ? 'border-red-400' : 'border-zinc-200'
                }`}
              />
              {errors.quantidade && <p className="text-xs text-red-500 mt-1">{errors.quantidade}</p>}
            </div>

            {/* Data de início */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="data_inicio">
                Data de início planejada <span className="text-red-500">*</span>
              </label>
              <input
                id="data_inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => handleDataInicioChange(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition ${
                  errors.data_inicio_plan ? 'border-red-400' : 'border-zinc-200'
                }`}
              />
              {errors.data_inicio_plan && (
                <p className="text-xs text-red-500 mt-1">{errors.data_inicio_plan}</p>
              )}
            </div>
          </div>
        </div>

        {/* Etapas de produção */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-700">Etapas de produção</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {categoria
                  ? 'Carregadas do template. Edite conforme necessário.'
                  : 'Selecione uma categoria para carregar as etapas automaticamente.'}
              </p>
            </div>
            <button
              type="button"
              onClick={addStage}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar etapa
            </button>
          </div>

          {loadingTemplate && (
            <div className="flex items-center justify-center py-8 text-zinc-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Carregando template...</span>
            </div>
          )}

          {!loadingTemplate && stages.length === 0 && (
            <div className="text-center py-8 text-zinc-400">
              <p className="text-sm">Nenhuma etapa adicionada.</p>
              {!categoria && (
                <p className="text-xs mt-1">Selecione uma categoria acima para pré-preencher.</p>
              )}
            </div>
          )}

          {!loadingTemplate && stages.length > 0 && (
            <div className="space-y-2">
              {stages.map((stage, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2.5 border border-zinc-100 rounded-lg hover:border-zinc-200 transition-colors group"
                >
                  {/* Ordem */}
                  <span className="w-5 text-center text-xs font-medium text-zinc-400 flex-shrink-0">
                    {i + 1}
                  </span>

                  {/* Nome */}
                  <input
                    type="text"
                    value={stage.nome}
                    onChange={(e) => updateStageName(i, e.target.value)}
                    placeholder={`Etapa ${i + 1}`}
                    className="flex-1 min-w-0 text-sm text-zinc-700 bg-transparent border-none outline-none placeholder:text-zinc-300 focus:ring-0"
                  />

                  {/* Datas */}
                  <div className="hidden md:flex items-center gap-1 text-xs text-zinc-400 flex-shrink-0">
                    <span>{stage.data_inicio_plan}</span>
                    <span>→</span>
                    <span>{stage.data_fim_plan}</span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30 rounded transition-colors"
                      aria-label="Mover para cima"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(i)}
                      disabled={i === stages.length - 1}
                      className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30 rounded transition-colors"
                      aria-label="Mover para baixo"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStage(i)}
                      className="p-1 text-zinc-400 hover:text-red-500 rounded transition-colors"
                      aria-label="Remover etapa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {errors.stages && (
            <p className="text-xs text-red-500 mt-2">{errors.stages}</p>
          )}
        </div>

        {/* Erro geral */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : 'Criar produto'}
          </button>
        </div>
      </form>
    </div>
  );
}
