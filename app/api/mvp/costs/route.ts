import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';
import { NextRequest } from 'next/server';

const VALID_TIPOS = [
  'materia-prima', 'mao-de-obra', 'terceirizacao',
  'logistica', 'embalagem', 'marketing', 'taxas-marketplace',
];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }, { status: 503 });
  }

  const productId = request.nextUrl.searchParams.get('product_id');
  if (!productId) {
    return Response.json({ error: 'product_id obrigatório' }, { status: 400 });
  }

  try {
    // Verifica ownership do produto
    const { data: product } = await supabase
      .from('mvp_products')
      .select('id')
      .eq('id', productId)
      .eq('user_id', session.user.id)
      .single();

    if (!product) {
      return Response.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Busca etapas com seus custos
    const { data: stages, error } = await supabase
      .from('mvp_stages')
      .select(`
        id, nome, ordem,
        mvp_costs(id, tipo, descricao, valor_planejado, valor_real, data_lancamento, created_at, created_by)
      `)
      .eq('product_id', productId)
      .order('ordem');

    if (error) throw error;

    // Calcula totais por etapa e desvio
    const enriched = (stages ?? []).map((s: any) => {
      const costs = s.mvp_costs ?? [];
      const total_planejado = costs.reduce((acc: number, c: any) => acc + Number(c.valor_planejado || 0), 0);
      const total_real = costs.reduce((acc: number, c: any) => acc + Number(c.valor_real || 0), 0);
      const desvio_pct = total_planejado > 0 ? ((total_real - total_planejado) / total_planejado) * 100 : null;
      return {
        id: s.id,
        nome: s.nome,
        ordem: s.ordem,
        costs: costs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        total_planejado,
        total_real,
        desvio_pct,
        alerta: desvio_pct !== null && desvio_pct > 15,
        aviso: desvio_pct !== null && desvio_pct > 5 && desvio_pct <= 15,
      };
    });

    const grand_planejado = enriched.reduce((acc, s) => acc + s.total_planejado, 0);
    const grand_real = enriched.reduce((acc, s) => acc + s.total_real, 0);

    return Response.json({ stages: enriched, grand_planejado, grand_real });
  } catch (err: any) {
    console.error('[GET /api/mvp/costs]', err);
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
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }, { status: 503 });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // Validação
  const errors: Record<string, string> = {};
  if (!body.stage_id) errors.stage_id = 'stage_id obrigatório';
  if (!body.tipo || !VALID_TIPOS.includes(body.tipo)) errors.tipo = 'Tipo inválido';
  if (body.valor_planejado == null || Number(body.valor_planejado) < 0) errors.valor_planejado = 'Valor planejado deve ser >= 0';
  if (body.valor_real != null && Number(body.valor_real) < 0) errors.valor_real = 'Valor real deve ser >= 0';
  if (!body.data_lancamento) errors.data_lancamento = 'Data é obrigatória';

  if (Object.keys(errors).length > 0) {
    return Response.json({ error: 'Dados inválidos', errors }, { status: 422 });
  }

  try {
    // Verifica que stage_id pertence ao usuário (via produto)
    const { data: stage } = await supabase
      .from('mvp_stages')
      .select('id, mvp_products!inner(user_id)')
      .eq('id', body.stage_id)
      .single();

    if (!stage || (stage.mvp_products as any)?.user_id !== session.user.id) {
      return Response.json({ error: 'Etapa não encontrada ou acesso negado' }, { status: 403 });
    }

    const { data: cost, error } = await supabase
      .from('mvp_costs')
      .insert({
        stage_id: body.stage_id,
        tipo: body.tipo,
        descricao: body.descricao?.trim() || null,
        valor_planejado: Number(body.valor_planejado),
        valor_real: body.valor_real != null ? Number(body.valor_real) : 0,
        data_lancamento: body.data_lancamento,
        created_by: session.user.id,
      })
      .select('id')
      .single();

    if (error) throw error;

    return Response.json({ cost }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/mvp/costs]', err);
    return Response.json({ error: err.message ?? 'Erro ao salvar custo' }, { status: 500 });
  }
}
