import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';
import { NextRequest } from 'next/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }, { status: 503 });
  }

  const { id } = await params;

  try {
    // Verifica ownership via stage → produto
    const { data: cost } = await supabase
      .from('mvp_costs')
      .select('id, mvp_stages!inner(mvp_products!inner(user_id))')
      .eq('id', id)
      .single();

    if (!cost) {
      return Response.json({ error: 'Lançamento não encontrado' }, { status: 404 });
    }

    const owner = (cost.mvp_stages as any)?.mvp_products?.user_id;
    if (owner !== session.user.id) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { error } = await supabase.from('mvp_costs').delete().eq('id', id);
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error('[DELETE /api/mvp/costs/[id]]', err);
    return Response.json({ error: err.message ?? 'Erro ao remover lançamento' }, { status: 500 });
  }
}
