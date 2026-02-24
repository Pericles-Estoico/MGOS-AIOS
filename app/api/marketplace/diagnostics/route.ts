import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';

/**
 * GET /api/marketplace/diagnostics
 * Diagnostic endpoint to check task status and identify stuck patterns
 */
export async function GET(request: NextRequest) {
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
    if (!['admin', 'head'].includes(userRole)) {
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

    // Get recent tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('source_type', ['analysis_approved', 'ai_generated'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json(
        { error: 'Erro ao buscar tarefas' },
        { status: 500 }
      );
    }

    // Get analysis plans status
    const { data: plans, error: plansError } = await supabase
      .from('marketplace_plans')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (plansError) {
      console.error('Error fetching plans:', plansError);
      return NextResponse.json(
        { error: 'Erro ao buscar planos' },
        { status: 500 }
      );
    }

    // Analyze task status (maps DB status: a_fazer, fazendo, enviado_qa, aprovado, concluido)
    const taskStats = {
      total: tasks?.length || 0,
      by_status: {
        pending: (tasks || []).filter(t => t.status === 'a_fazer').length,
        in_progress: (tasks || []).filter(t => t.status === 'fazendo').length,
        in_qa: (tasks || []).filter(t => t.status === 'enviado_qa').length,
        approved: (tasks || []).filter(t => t.status === 'aprovado').length,
        completed: (tasks || []).filter(t => t.status === 'concluido').length,
      },
      by_source: {
        analysis_approved: (tasks || []).filter(t => t.source_type === 'analysis_approved').length,
        ai_generated: (tasks || []).filter(t => t.source_type === 'ai_generated').length,
      },
      by_channel: {} as Record<string, number>,
    };

    // Count by channel
    (tasks || []).forEach(task => {
      taskStats.by_channel[task.channel] = (taskStats.by_channel[task.channel] || 0) + 1;
    });

    // Analyze plan status (marketplace_plans table status: draft, approved, rejected)
    const planStats = {
      total: plans?.length || 0,
      by_status: {
        pending: (plans || []).filter(p => p.status === 'draft').length,
        approved: (plans || []).filter(p => p.status === 'approved').length,
        rejected: (plans || []).filter(p => p.status === 'rejected').length,
      },
      phase1_created: (plans || []).filter(p => p.phase1_tasks_created).length,
      phase1_not_created: (plans || []).filter(p => !p.phase1_tasks_created).length,
    };

    // Identify stuck patterns
    const stuckPatterns = {
      pending_plans_old: (plans || [])
        .filter(p => p.status === 'draft' && new Date(p.created_at).getTime() < Date.now() - 2 * 60 * 60 * 1000)
        .map(p => ({
          id: p.id,
          title: p.title,
          created_at: p.created_at,
          hours_stuck: Math.round((Date.now() - new Date(p.created_at).getTime()) / 1000 / 60 / 60),
          phase1_created: p.phase1_tasks_created,
          channels: p.channels,
        })),

      tasks_pending_old: (tasks || [])
        .filter(t => t.status === 'a_fazer' && new Date(t.created_at).getTime() < Date.now() - 4 * 60 * 60 * 1000)
        .map(t => ({
          id: t.id,
          title: t.title,
          created_at: t.created_at,
          hours_stuck: Math.round((Date.now() - new Date(t.created_at).getTime()) / 1000 / 60 / 60),
          source_type: t.source_type,
          channel: t.channel,
        })),
    };

    // Recommendations
    const recommendations = [];

    if (stuckPatterns.pending_plans_old.length > 0) {
      recommendations.push({
        severity: 'HIGH',
        issue: 'Plans stuck in pending state',
        count: stuckPatterns.pending_plans_old.length,
        action: 'Run POST /api/marketplace/analysis/recover to force Phase 1 creation',
      });
    }

    if (planStats.phase1_not_created > 0) {
      recommendations.push({
        severity: 'MEDIUM',
        issue: 'Plans approved but Phase 1 not yet created',
        count: planStats.phase1_not_created,
        action: 'Monitor these plans, may need recovery',
      });
    }

    if (stuckPatterns.tasks_pending_old.length > 0) {
      recommendations.push({
        severity: 'MEDIUM',
        issue: 'Tasks pending for > 4 hours',
        count: stuckPatterns.tasks_pending_old.length,
        action: 'Assign and start these tasks',
      });
    }

    // No failed status in schema - all tasks are in one of: a_fazer, fazendo, enviado_qa, aprovado, concluido

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        tasks: taskStats,
        plans: planStats,
        stuck_patterns: stuckPatterns,
        recommendations,
        health: {
          status: stuckPatterns.pending_plans_old.length === 0 ? 'healthy' : 'warning',
          message:
            stuckPatterns.pending_plans_old.length === 0
              ? '✅ No stuck plans detected'
              : `⚠️ ${stuckPatterns.pending_plans_old.length} stuck plans detected`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in diagnostics:', error);
    return NextResponse.json(
      {
        error: 'Erro ao gerar diagnóstico',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
