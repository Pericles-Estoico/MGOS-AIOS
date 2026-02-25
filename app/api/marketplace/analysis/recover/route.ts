import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';
import { createPhase1Tasks } from '@lib/ai/agent-loop';

/**
 * POST /api/marketplace/analysis/recover
 * Recover stuck analysis plans by attempting Phase 1 task creation
 * Admin only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Authorization check (admin only, or localhost dev mode)
    const userRole = session.user?.role as string;
    const isLocalhost = request.headers.get('host')?.includes('localhost');
    const isDev = process.env.NODE_ENV === 'development';

    if (userRole !== 'admin' && !(isLocalhost && isDev)) {
      return NextResponse.json(
        { error: 'Apenas admin pode recuperar análises' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Banco de dados não disponível' },
        { status: 500 }
      );
    }

    // Find stuck analysis plans (pending for > 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: stuckPlans, error: fetchError } = await supabase
      .from('marketplace_plans')
      .select('*')
      .eq('status', 'pending')
      .eq('phase1_tasks_created', false)
      .lt('created_at', oneHourAgo)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching stuck plans:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar análises travadas' },
        { status: 500 }
      );
    }

    if (!stuckPlans || stuckPlans.length === 0) {
      return NextResponse.json(
        {
          recovered: 0,
          message: 'Nenhuma análise travada encontrada',
          details: `Plans não encontrados pendentes há mais de 1 hora`,
        },
        { status: 200 }
      );
    }

    console.log(`🔍 Found ${stuckPlans.length} stuck analysis plans`);

    // Attempt to recover each stuck plan
    const recoveryResults: Array<{
      planId: string;
      title: string;
      success: boolean;
      taskIds?: string[];
      error?: string;
      timeStuck?: number;
    }> = [];

    for (const plan of stuckPlans) {
      const planId = plan.id;
      const timeStuck = Math.round(
        (Date.now() - new Date(plan.created_at).getTime()) / 1000 / 60
      ); // minutes

      console.log(`⏳ Attempting to recover plan ${planId} (stuck ${timeStuck}m)`);

      try {
        const taskIds = await createPhase1Tasks(planId);

        recoveryResults.push({
          planId,
          title: plan.title,
          success: true,
          taskIds,
          timeStuck,
        });

        console.log(`✅ Recovered plan ${planId}: ${taskIds.length} tasks created`);
      } catch (error) {
        recoveryResults.push({
          planId,
          title: plan.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timeStuck,
        });

        console.error(`❌ Failed to recover plan ${planId}:`, error);
      }
    }

    // Summary
    const successCount = recoveryResults.filter(r => r.success).length;
    const failureCount = recoveryResults.filter(r => !r.success).length;

    return NextResponse.json(
      {
        recovered: successCount,
        failed: failureCount,
        total: recoveryResults.length,
        details: recoveryResults,
        message: `✅ ${successCount} análises recuperadas, ❌ ${failureCount} falharam`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in analysis recovery:', error);
    return NextResponse.json(
      {
        error: 'Erro ao recuperar análises',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
