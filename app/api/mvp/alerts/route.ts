import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }, { status: 503 });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('mvp_products')
      .select(`
        id, nome, status, data_venda_estimada,
        mvp_stages(status, data_fim_plan, mvp_costs(valor_real, valor_planejado))
      `)
      .eq('user_id', session.user.id)
      .not('status', 'in', '("concluido","cancelado")');

    if (error) throw error;

    const alerts: { id: string; type: string; produto_id: string; produto_nome: string; mensagem: string }[] = [];

    for (const p of data ?? []) {
      const stages = (p as any).mvp_stages ?? [];

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

      if (atrasadas > 0) {
        alerts.push({
          id: `atraso-${p.id}`,
          type: 'atraso',
          produto_id: p.id,
          produto_nome: p.nome,
          mensagem: `${atrasadas} etapa${atrasadas > 1 ? 's' : ''} atrasada${atrasadas > 1 ? 's' : ''}`,
        });
      }

      if (!p.data_venda_estimada) {
        alerts.push({
          id: `sem-data-${p.id}`,
          type: 'sem_data_venda',
          produto_id: p.id,
          produto_nome: p.nome,
          mensagem: 'Sem data de venda estimada',
        });
      }

      if (custoPlanejado > 0) {
        const desvio = ((custoReal - custoPlanejado) / custoPlanejado) * 100;
        if (desvio > 15) {
          alerts.push({
            id: `desvio-${p.id}`,
            type: 'desvio_custo',
            produto_id: p.id,
            produto_nome: p.nome,
            mensagem: `Custo ${Math.round(desvio)}% acima do planejado`,
          });
        }
      }
    }

    return Response.json({ alerts, count: alerts.length });
  } catch (err: any) {
    console.error('[GET /api/mvp/alerts]', err);
    return Response.json({ error: err.message ?? 'Erro ao buscar alertas' }, { status: 500 });
  }
}
