import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';
import { NextRequest } from 'next/server';

const VALID_CATEGORIAS = ['camiseta', 'calca', 'vestido', 'conjunto', 'moda-infantil', 'jaqueta', 'acessorio'];
const VALID_STATUS = ['planejado', 'em_andamento', 'concluido', 'cancelado'];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada. Adicione ao .env.local.' },
      { status: 503 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');

  const today = new Date().toISOString().split('T')[0];

  try {
    let query = supabase
      .from('mvp_products')
      .select(`
        id, nome, categoria, canal_venda, quantidade,
        data_inicio_plan, status, created_at,
        preco_venda, taxa_canal, prazo_repasse_dias, data_venda_estimada,
        mvp_stages(
          id, status, data_fim_plan,
          mvp_costs(valor_real, valor_planejado)
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (status && VALID_STATUS.includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const products = (data ?? []).map((p: any) => {
      const stages = p.mvp_stages ?? [];
      const total = stages.length;
      const concluidas = stages.filter((s: any) => s.status === 'concluida').length;
      const atrasadas = stages.filter(
        (s: any) => s.data_fim_plan && s.data_fim_plan < today && s.status !== 'concluida'
      ).length;

      let custoReal = 0;
      let custoPlanejado = 0;
      stages.forEach((s: any) => {
        (s.mvp_costs ?? []).forEach((c: any) => {
          custoReal += Number(c.valor_real || 0);
          custoPlanejado += Number(c.valor_planejado || 0);
        });
      });

      const desvio = custoPlanejado > 0
        ? ((custoReal - custoPlanejado) / custoPlanejado) * 100
        : 0;

      let dataRecebimento: string | null = null;
      if (p.data_venda_estimada && p.prazo_repasse_dias) {
        const d = new Date(p.data_venda_estimada + 'T00:00:00');
        d.setDate(d.getDate() + Number(p.prazo_repasse_dias));
        dataRecebimento = d.toISOString().split('T')[0];
      }

      const receitaLiquida = p.preco_venda && p.taxa_canal
        ? Number(p.preco_venda) * Number(p.quantidade) * (1 - Number(p.taxa_canal) / 100)
        : null;
      const margemEstimada = receitaLiquida && custoReal > 0
        ? ((receitaLiquida - custoReal) / receitaLiquida) * 100
        : null;

      return {
        ...p,
        mvp_stages: undefined,
        progresso: total > 0 ? Math.round((concluidas / total) * 100) : 0,
        tem_atraso: atrasadas > 0,
        tem_desvio_custo: desvio > 15,
        total_etapas: total,
        etapas_concluidas: concluidas,
        custo_acumulado_real: custoReal,
        custo_planejado_total: custoPlanejado,
        desvio_pct: custoPlanejado > 0 ? Math.round(desvio * 10) / 10 : null,
        receita_liquida_estimada: receitaLiquida,
        margem_estimada: margemEstimada !== null ? Math.round(margemEstimada * 10) / 10 : null,
        data_recebimento_estimada: dataRecebimento,
      };
    });

    return Response.json({ products });
  } catch (err: any) {
    console.error('[GET /api/mvp/products]', err);
    return Response.json({ error: err.message ?? 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada. Adicione ao .env.local.' },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // Validação server-side
  const errors: Record<string, string> = {};
  if (!body.nome?.trim()) errors.nome = 'Nome é obrigatório';
  if (!body.categoria || !VALID_CATEGORIAS.includes(body.categoria)) errors.categoria = 'Categoria inválida';
  if (!body.canal_venda?.trim()) errors.canal_venda = 'Canal de venda é obrigatório';
  if (!body.quantidade || body.quantidade < 1) errors.quantidade = 'Quantidade deve ser maior que 0';
  if (!body.data_inicio_plan) errors.data_inicio_plan = 'Data de início é obrigatória';
  if (!Array.isArray(body.stages) || body.stages.length === 0) errors.stages = 'Produto deve ter ao menos uma etapa';

  if (Object.keys(errors).length > 0) {
    return Response.json({ error: 'Dados inválidos', errors }, { status: 422 });
  }

  try {
    // Inserir produto
    const { data: product, error: productError } = await supabase
      .from('mvp_products')
      .insert({
        user_id: session.user.id,
        nome: body.nome.trim(),
        categoria: body.categoria,
        canal_venda: body.canal_venda.trim(),
        quantidade: Number(body.quantidade),
        data_inicio_plan: body.data_inicio_plan,
        status: 'planejado',
      })
      .select('id')
      .single();

    if (productError) throw productError;

    // Inserir etapas com ordem recalculada
    const stages = body.stages.map((s: any, i: number) => ({
      product_id: product.id,
      nome: s.nome?.trim() || `Etapa ${i + 1}`,
      ordem: i + 1,
      data_inicio_plan: s.data_inicio_plan || null,
      data_fim_plan: s.data_fim_plan || null,
      status: 'planejada',
    }));

    const { error: stagesError } = await supabase
      .from('mvp_stages')
      .insert(stages);

    if (stagesError) {
      // Rollback manual: remover produto inserido
      await supabase.from('mvp_products').delete().eq('id', product.id);
      throw stagesError;
    }

    return Response.json({ product: { id: product.id } }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/mvp/products]', err);
    return Response.json({ error: err.message ?? 'Erro ao salvar produto' }, { status: 500 });
  }
}
