import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';
import { NextRequest } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  // Apenas campos financeiros permitidos neste endpoint
  const allowed = ['preco_venda', 'taxa_canal', 'prazo_repasse_dias', 'data_venda_estimada'];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) {
      const val = body[key];
      updates[key] = val === '' || val === null ? null : val;
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 });
  }

  try {
    const { data: product, error } = await supabase
      .from('mvp_products')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select('id, preco_venda, taxa_canal, prazo_repasse_dias, data_venda_estimada')
      .single();

    if (error) throw error;
    if (!product) return Response.json({ error: 'Produto não encontrado' }, { status: 404 });

    return Response.json({ product });
  } catch (err: any) {
    console.error('[PATCH /api/mvp/products/[id]]', err);
    return Response.json({ error: err.message ?? 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }, { status: 503 });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    // Produto (verifica ownership)
    const { data: product, error: productError } = await supabase
      .from('mvp_products')
      .select('id, nome, categoria, canal_venda, quantidade, data_inicio_plan, status, created_at, preco_venda, taxa_canal, prazo_repasse_dias, data_venda_estimada')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (productError || !product) {
      return Response.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Etapas
    const { data: stages, error: stagesError } = await supabase
      .from('mvp_stages')
      .select('id, nome, ordem, status, data_inicio_plan, data_fim_plan, data_inicio_real, data_fim_real, responsavel_id')
      .eq('product_id', params.id)
      .order('ordem');

    if (stagesError) throw stagesError;

    // Histórico via audit_logs
    const stageIds = (stages ?? []).map((s) => s.id);
    let auditLogs: any[] = [];
    if (stageIds.length > 0) {
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('id, entity_id, action, old_values, new_values, changed_by, changed_at')
        .eq('entity_type', 'mvp_stage')
        .in('entity_id', stageIds)
        .order('changed_at', { ascending: false });
      auditLogs = logs ?? [];
    }

    // Enriquecer etapas com flag atrasada e histórico
    const enrichedStages = (stages ?? []).map((s) => ({
      ...s,
      is_atrasada: s.data_fim_plan && s.data_fim_plan < today && s.status !== 'concluida',
      historico: auditLogs.filter((l) => l.entity_id === s.id),
    }));

    const total = enrichedStages.length;
    const concluidas = enrichedStages.filter((s) => s.status === 'concluida').length;
    const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    return Response.json({ product, stages: enrichedStages, progresso, total, concluidas });
  } catch (err: any) {
    console.error('[GET /api/mvp/products/[id]]', err);
    return Response.json({ error: err.message ?? 'Erro interno' }, { status: 500 });
  }
}
