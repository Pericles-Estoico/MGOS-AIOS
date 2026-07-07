import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';
import { NextRequest } from 'next/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }, { status: 503 });
  }

  try {
    // Fetch source product + stages (no costs)
    const { data: source, error: srcError } = await supabase
      .from('mvp_products')
      .select(`
        nome, categoria, canal_venda, quantidade,
        preco_venda, taxa_canal, prazo_repasse_dias,
        mvp_stages(nome, ordem)
      `)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (srcError || !source) {
      return Response.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Insert new product (clear dates + financial fields, reset status)
    const { data: newProduct, error: insertError } = await supabase
      .from('mvp_products')
      .insert({
        user_id: session.user.id,
        nome: `${source.nome} (cópia)`,
        categoria: source.categoria,
        canal_venda: source.canal_venda,
        quantidade: source.quantidade,
        preco_venda: source.preco_venda,
        taxa_canal: source.taxa_canal,
        prazo_repasse_dias: source.prazo_repasse_dias,
        status: 'planejado',
        data_inicio_plan: null,
        data_venda_estimada: null,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    // Insert stages (no dates, reset status)
    const stages = (source.mvp_stages ?? []).map((s: any) => ({
      product_id: newProduct.id,
      nome: s.nome,
      ordem: s.ordem,
      status: 'planejada',
      data_inicio_plan: null,
      data_fim_plan: null,
    }));

    if (stages.length > 0) {
      const { error: stagesError } = await supabase.from('mvp_stages').insert(stages);
      if (stagesError) {
        await supabase.from('mvp_products').delete().eq('id', newProduct.id);
        throw stagesError;
      }
    }

    return Response.json({ product: { id: newProduct.id } }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/mvp/products/[id]/duplicate]', err);
    return Response.json({ error: err.message ?? 'Erro ao duplicar produto' }, { status: 500 });
  }
}
