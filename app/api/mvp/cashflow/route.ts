import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }, { status: 503 });
  }

  const months = Number(request.nextUrl.searchParams.get('months') ?? 6);
  const clampedMonths = Math.min(Math.max(months, 1), 24);

  try {
    const { data: products, error } = await supabase
      .from('mvp_products')
      .select(`
        id, nome, preco_venda, taxa_canal, quantidade,
        data_venda_estimada, prazo_repasse_dias, status,
        mvp_stages(
          id, data_inicio_plan, data_fim_plan,
          mvp_costs(valor_planejado, data_lancamento)
        )
      `)
      .eq('user_id', session.user.id)
      .neq('status', 'cancelado');

    if (error) throw error;

    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);

    // Build month buckets
    const buckets: Record<string, { saidas: number; entradas: number; label: string }> = {};
    for (let i = 0; i < clampedMonths; i++) {
      const d = new Date(today);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      buckets[key] = { saidas: 0, entradas: 0, label };
    }

    const semDataRecebimento: string[] = [];

    (products ?? []).forEach((p: any) => {
      // Entradas: receita líquida no mês de recebimento
      if (p.data_venda_estimada && p.prazo_repasse_dias != null && p.preco_venda) {
        const d = new Date(p.data_venda_estimada + 'T00:00:00');
        d.setDate(d.getDate() + Number(p.prazo_repasse_dias));
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (buckets[key]) {
          const taxa = Number(p.taxa_canal ?? 0);
          const receita = Number(p.preco_venda) * Number(p.quantidade) * (1 - taxa / 100);
          buckets[key].entradas += receita;
        }
      } else if (!p.data_venda_estimada) {
        semDataRecebimento.push(p.nome);
      }

      // Saídas: custos planejados agrupados pelo mês da data_lancamento ou data_fim_plan da etapa
      (p.mvp_stages ?? []).forEach((s: any) => {
        (s.mvp_costs ?? []).forEach((c: any) => {
          const dateStr = c.data_lancamento ?? s.data_fim_plan;
          if (!dateStr) return;
          const key = dateStr.substring(0, 7); // YYYY-MM
          if (buckets[key]) {
            buckets[key].saidas += Number(c.valor_planejado ?? 0);
          }
        });
      });
    });

    // Build monthly array with running balance
    let saldoAcumulado = 0;
    const months_data = Object.entries(buckets).map(([key, b]) => {
      const saldoMes = b.entradas - b.saidas;
      saldoAcumulado += saldoMes;
      return {
        key,
        label: b.label,
        saidas: Math.round(b.saidas * 100) / 100,
        entradas: Math.round(b.entradas * 100) / 100,
        saldo_mes: Math.round(saldoMes * 100) / 100,
        saldo_acumulado: Math.round(saldoAcumulado * 100) / 100,
      };
    });

    const totalEntradas = months_data.reduce((s, m) => s + m.entradas, 0);
    const totalSaidas = months_data.reduce((s, m) => s + m.saidas, 0);

    return Response.json({
      months: months_data,
      summary: {
        total_entradas: Math.round(totalEntradas * 100) / 100,
        total_saidas: Math.round(totalSaidas * 100) / 100,
        saldo_liquido: Math.round((totalEntradas - totalSaidas) * 100) / 100,
      },
      sem_data_recebimento: semDataRecebimento,
    });
  } catch (err: any) {
    console.error('[GET /api/mvp/cashflow]', err);
    return Response.json({ error: err.message ?? 'Erro interno' }, { status: 500 });
  }
}
