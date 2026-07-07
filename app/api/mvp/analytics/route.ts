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
        id, nome, status, preco_venda, taxa_canal, quantidade,
        mvp_stages(status, data_fim_plan, mvp_costs(valor_real, valor_planejado))
      `)
      .eq('user_id', session.user.id);

    if (error) throw error;

    type ProductRow = {
      id: string;
      nome: string;
      status: string;
      margem: number | null;
      custoReal: number;
      custoPlanejado: number;
      desvio: number | null;
      temAtraso: boolean;
    };

    const rows: ProductRow[] = (data ?? []).map((p: any) => {
      const stages = p.mvp_stages ?? [];
      let custoReal = 0;
      let custoPlanejado = 0;
      let atrasadas = 0;

      stages.forEach((s: any) => {
        if (s.data_fim_plan && s.data_fim_plan < today && s.status !== 'concluida') atrasadas++;
        (s.mvp_costs ?? []).forEach((c: any) => {
          custoReal += Number(c.valor_real || 0);
          custoPlanejado += Number(c.valor_planejado || 0);
        });
      });

      const receitaLiquida = p.preco_venda && p.taxa_canal
        ? Number(p.preco_venda) * Number(p.quantidade) * (1 - Number(p.taxa_canal) / 100)
        : null;

      const margem = receitaLiquida && custoReal > 0
        ? Math.round(((receitaLiquida - custoReal) / receitaLiquida) * 1000) / 10
        : null;

      const desvio = custoPlanejado > 0
        ? Math.round(((custoReal - custoPlanejado) / custoPlanejado) * 1000) / 10
        : null;

      return {
        id: p.id,
        nome: p.nome,
        status: p.status,
        margem,
        custoReal,
        custoPlanejado,
        desvio,
        temAtraso: atrasadas > 0,
      };
    });

    // Status distribution
    const statusDist: Record<string, number> = {};
    rows.forEach((r) => {
      statusDist[r.status] = (statusDist[r.status] ?? 0) + 1;
    });

    // Top 5 por margem (produtos com margem calculada, descendente)
    const top5Margem = [...rows]
      .filter((r) => r.margem !== null)
      .sort((a, b) => (b.margem ?? 0) - (a.margem ?? 0))
      .slice(0, 5)
      .map((r) => ({ id: r.id, nome: r.nome, margem: r.margem }));

    // Produtos em risco: desvio > 15% OU tem atraso, excluindo concluídos/cancelados
    const emRisco = rows
      .filter(
        (r) =>
          !['concluido', 'cancelado'].includes(r.status) &&
          ((r.desvio !== null && r.desvio > 15) || r.temAtraso)
      )
      .map((r) => ({
        id: r.id,
        nome: r.nome,
        desvio: r.desvio,
        temAtraso: r.temAtraso,
      }));

    // Totais gerais
    const totalCustoReal = rows.reduce((s, r) => s + r.custoReal, 0);
    const totalCustoPlanejado = rows.reduce((s, r) => s + r.custoPlanejado, 0);
    const totalProdutos = rows.length;
    const mediaMargemAtivos = (() => {
      const ativos = rows.filter(
        (r) => r.margem !== null && !['cancelado'].includes(r.status)
      );
      if (!ativos.length) return null;
      return Math.round((ativos.reduce((s, r) => s + (r.margem ?? 0), 0) / ativos.length) * 10) / 10;
    })();

    return Response.json({
      top5Margem,
      emRisco,
      statusDist,
      totais: {
        produtos: totalProdutos,
        custoReal: totalCustoReal,
        custoPlanejado: totalCustoPlanejado,
        mediaMargemAtivos,
      },
    });
  } catch (err: any) {
    console.error('[GET /api/mvp/analytics]', err);
    return Response.json({ error: err.message ?? 'Erro ao buscar analytics' }, { status: 500 });
  }
}
