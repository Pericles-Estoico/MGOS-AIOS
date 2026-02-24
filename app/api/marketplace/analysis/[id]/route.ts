import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';
import { createPhase1Tasks } from '@/lib/ai/agent-loop';
import { enqueuePhase1Job } from '@lib/queue/phase1-queue';

/**
 * GET /api/marketplace/analysis/[id]
 * Get detailed analysis plan
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Authorization check
    const userRole = session.user?.role as string;
    if (!['admin', 'head', 'qa'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Sem permissão' },
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

    const { data: plan, error } = await supabase
      .from('marketplace_plans')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !plan) {
      return NextResponse.json(
        { error: 'Análise não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching analysis plan:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar análise',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/marketplace/analysis/[id]
 * Approve or reject analysis plan
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Authorization check (admin/head only for approval)
    const userRole = session.user?.role as string;
    if (!['admin', 'head'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Apenas admin e head podem aprovar/rejeitar análises' },
        { status: 403 }
      );
    }

    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID não encontrado' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, reason } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action inválida. Use "approve" ou "reject"' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Banco de dados não disponível' },
        { status: 500 }
      );
    }

    // Fetch current plan
    const { data: plan, error: fetchError } = await supabase
      .from('marketplace_plans')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !plan) {
      return NextResponse.json(
        { error: 'Análise não encontrada' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // Update plan to approved
      const { error: updateError } = await supabase
        .from('marketplace_plans')
        .update({
          status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (updateError) {
        console.error('Error approving plan:', updateError);
        return NextResponse.json(
          { error: 'Erro ao aprovar plano' },
          { status: 500 }
        );
      }

      // Create Phase 1 tasks with fallback
      let jobId: string = '';
      let taskIds: string[] = [];

      try {
        // First, try to enqueue job with Redis (async)
        const planData = plan.plan_data || {};
        const opportunities = planData.opportunities || [];
        const channels = planData.channels || plan.channels || [];

        try {
          jobId = await enqueuePhase1Job({
            planId: params.id,
            channels,
            opportunities,
            metadata: {
              createdBy: userId,
              approvedAt: new Date(),
              reason: reason || 'User approval',
            },
          });
          console.log(`✅ Phase 1 job enqueued: ${jobId} for plan ${params.id}`);
        } catch (queueError) {
          console.warn('⚠️ Redis queue unavailable, using fallback sync processing:', queueError instanceof Error ? queueError.message : queueError);

          // FALLBACK: Create Phase 1 tasks directly (synchronous)
          try {
            taskIds = await createPhase1Tasks(params.id);
            jobId = `sync-${params.id}-${Date.now()}`;
            console.log(`✅ Phase 1 tasks created directly (sync fallback): ${taskIds.length} tasks for plan ${params.id}`);
          } catch (syncError) {
            console.error('❌ Fallback sync task creation also failed:', syncError);
            throw syncError;
          }
        }
      } catch (taskError) {
        console.error('❌ Error in Phase 1 task creation:', taskError);
        return NextResponse.json(
          {
            error: 'Erro ao criar tarefas Phase 1',
            details: taskError instanceof Error ? taskError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }

      // Return 202 Accepted with job ID for polling
      return NextResponse.json(
        {
          status: 'approved',
          message: 'Plano aprovado. Tarefas sendo processadas...',
          jobId,
          pollUrl: `/api/marketplace/jobs/${jobId}`,
        },
        { status: 202 }
      );
    } else {
      // Reject plan
      if (!reason) {
        return NextResponse.json(
          { error: 'Motivo da rejeição é obrigatório' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('marketplace_plans')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (updateError) {
        console.error('Error rejecting plan:', updateError);
        return NextResponse.json(
          { error: 'Erro ao rejeitar plano' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: 'rejected',
        message: 'Plano rejeitado',
        reason,
      });
    }
  } catch (error) {
    console.error('Error in analysis action:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar ação',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
