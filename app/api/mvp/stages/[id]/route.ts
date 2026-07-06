import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';
import { NextRequest } from 'next/server';

const VALID_TRANSITIONS: Record<string, string> = {
  planejada:    'em_andamento',
  em_andamento: 'concluida',
};

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

  const { action } = body; // 'iniciar' | 'concluir'
  if (!['iniciar', 'concluir'].includes(action)) {
    return Response.json({ error: 'Ação inválida. Use "iniciar" ou "concluir".' }, { status: 422 });
  }

  try {
    // Buscar etapa e verificar ownership via produto
    const { data: stage, error: fetchError } = await supabase
      .from('mvp_stages')
      .select('id, status, product_id, mvp_products!inner(user_id)')
      .eq('id', params.id)
      .single();

    if (fetchError || !stage) {
      return Response.json({ error: 'Etapa não encontrada' }, { status: 404 });
    }

    const productOwner = (stage.mvp_products as any)?.user_id;
    if (productOwner !== session.user.id) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const currentStatus = stage.status;
    const expectedCurrent = action === 'iniciar' ? 'planejada' : 'em_andamento';

    if (currentStatus !== expectedCurrent) {
      return Response.json(
        { error: `Etapa está "${currentStatus}", não pode executar "${action}"` },
        { status: 409 }
      );
    }

    const newStatus = VALID_TRANSITIONS[currentStatus];
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const updateData: Record<string, any> = { status: newStatus };
    if (action === 'iniciar') {
      updateData.data_inicio_real = today;
      updateData.responsavel_id = session.user.id;
    } else {
      updateData.data_fim_real = today;
    }

    const { error: updateError } = await supabase
      .from('mvp_stages')
      .update(updateData)
      .eq('id', params.id);

    if (updateError) throw updateError;

    // Registrar no audit_log
    await supabase.from('audit_logs').insert({
      entity_type: 'mvp_stage',
      entity_id: params.id,
      action: 'STATUS_CHANGE',
      changed_by: session.user.id,
      old_values: { status: currentStatus },
      new_values: { status: newStatus, ...updateData },
      changed_at: now,
    });

    return Response.json({ stage: { id: params.id, status: newStatus, ...updateData } });
  } catch (err: any) {
    console.error('[PATCH /api/mvp/stages/[id]]', err);
    return Response.json({ error: err.message ?? 'Erro ao atualizar etapa' }, { status: 500 });
  }
}
