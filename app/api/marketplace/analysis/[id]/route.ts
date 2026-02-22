import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { createPhase1Tasks } from '@/lib/ai/agent-loop';

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

      // Create Phase 1 tasks automatically
      let taskIds: string[] = [];
      try {
        taskIds = await createPhase1Tasks(params.id);
        console.log(`✅ Fase 1 tarefas criadas: ${taskIds.length}`);
      } catch (taskError) {
        console.error('Error creating Phase 1 tasks:', taskError);
        // Don't fail the approval if tasks creation fails
      }

      return NextResponse.json({
        status: 'approved',
        message: 'Plano aprovado com sucesso',
        phase1TasksCreated: taskIds.length,
        taskIds,
      });
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
