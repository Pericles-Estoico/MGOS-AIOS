import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@lib/supabase';
import { createPhase1Tasks } from '@lib/ai/agent-loop';

/**
 * POST /api/marketplace/analysis/unlock-dev
 * DEVELOPMENT ONLY: Auto-approve and unlock all pending analyses (no auth required in dev mode)
 * This is a temporary endpoint for Marathon Mode testing
 * Remove in production
 */
export async function POST(request: NextRequest) {
  // Safety: Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Este endpoint está disponível apenas em desenvolvimento' },
      { status: 403 }
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Banco de dados não disponível' },
        { status: 500 }
      );
    }

    // Find ALL pending analyses
    const { data: pendingPlans, error: fetchError } = await supabase
      .from('marketplace_plans')
      .select('*')
      .eq('status', 'pending')
      .eq('phase1_tasks_created', false)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching pending plans:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar análises pendentes' },
        { status: 500 }
      );
    }

    if (!pendingPlans || pendingPlans.length === 0) {
      return NextResponse.json(
        {
          unlocked: 0,
          message: '✅ Nenhuma análise pendente para desbloquear',
          details: [],
        },
        { status: 200 }
      );
    }

    console.log(`🔓 [DEV MODE] Desbloqueando ${pendingPlans.length} análises pendentes...`);

    const unlockedResults: Array<{
      planId: string;
      title: string;
      channels: string[];
      success: boolean;
      taskIds?: string[];
      error?: string;
      timeStuck?: number;
    }> = [];

    // Auto-approve each pending plan
    for (const plan of pendingPlans) {
      const planId = plan.id;
      const timeStuck = Math.round(
        (Date.now() - new Date(plan.created_at).getTime()) / 1000 / 60
      );

      console.log(`⏳ [${plan.title}] Tentando desbloquear (travada há ${timeStuck}m)...`);

      try {
        // Step 1: Auto-approve the plan
        const { error: approveError } = await supabase
          .from('marketplace_plans')
          .update({
            status: 'approved',
            approved_by: 'dev-unlock',
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', planId);

        if (approveError) {
          throw new Error(`Erro ao aprovar: ${approveError.message}`);
        }

        // Step 2: Create Phase 1 tasks
        const taskIds = await createPhase1Tasks(planId);

        unlockedResults.push({
          planId,
          title: plan.title,
          channels: plan.channels || [],
          success: true,
          taskIds,
          timeStuck,
        });

        console.log(`✅ [${plan.title}] Desbloqueada com sucesso: ${taskIds.length} tarefas criadas`);
      } catch (error) {
        unlockedResults.push({
          planId,
          title: plan.title,
          channels: plan.channels || [],
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timeStuck,
        });

        console.error(`❌ [${plan.title}] Falha ao desbloquear:`, error);
      }
    }

    // Summary
    const successCount = unlockedResults.filter(r => r.success).length;
    const failureCount = unlockedResults.filter(r => !r.success).length;
    const totalTasks = unlockedResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.taskIds?.length || 0), 0);

    return NextResponse.json(
      {
        unlocked: successCount,
        failed: failureCount,
        total: unlockedResults.length,
        totalTasksCreated: totalTasks,
        details: unlockedResults,
        message: `🔓 ${successCount}/${unlockedResults.length} análises desbloqueadas | ${totalTasks} tarefas criadas`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in dev unlock:', error);
    return NextResponse.json(
      {
        error: 'Erro ao desbloquear análises',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
