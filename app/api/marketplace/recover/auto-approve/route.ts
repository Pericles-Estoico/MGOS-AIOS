import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';
import { createPhase1Tasks } from '@/lib/ai/agent-loop';

/**
 * POST /api/marketplace/recover/auto-approve
 * Auto-approve pending analyses and create Phase 1 tasks
 * ⚠️ Development only - destravar análises travadas
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = session.user?.role as string;
    if (!['admin', 'head'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only admin/head can auto-approve' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get all pending analyses
    const { data: pendingAnalyses, error: fetchError } = await supabase
      .from('marketplace_plans')
      .select('id, title, channels, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch pending analyses', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!pendingAnalyses || pendingAnalyses.length === 0) {
      return NextResponse.json({
        status: 'success',
        message: 'No pending analyses to approve',
        approvedCount: 0,
        tasksCreated: 0,
      });
    }

    const results: any[] = [];
    let totalTasksCreated = 0;

    // Process each pending analysis
    for (const analysis of pendingAnalyses) {
      try {
        // Update status to approved
        const { error: updateError } = await supabase
          .from('marketplace_plans')
          .update({
            status: 'approved',
            approved_by: session.user.id,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', analysis.id);

        if (updateError) {
          throw updateError;
        }

        // Create Phase 1 tasks
        let taskIds: string[] = [];
        try {
          taskIds = await createPhase1Tasks(analysis.id);
          console.log(`✅ Created ${taskIds.length} Phase 1 tasks for analysis ${analysis.id}`);
        } catch (taskError) {
          console.warn(`⚠️ Failed to create Phase 1 tasks for ${analysis.id}:`, taskError);
          taskIds = [];
        }

        totalTasksCreated += taskIds.length;

        results.push({
          analysisId: analysis.id,
          title: analysis.title,
          channels: analysis.channels,
          status: 'approved',
          taskIds,
          tasksCreated: taskIds.length,
          success: true,
        });
      } catch (error) {
        results.push({
          analysisId: analysis.id,
          title: analysis.title,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        });
      }
    }

    return NextResponse.json({
      status: 'success',
      message: `Auto-approved ${results.filter((r) => r.success).length} analyses`,
      approvedCount: results.filter((r) => r.success).length,
      tasksCreated: totalTasksCreated,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Auto-approve failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/recover/auto-approve
 * Show instructions
 */
export async function GET() {
  return NextResponse.json({
    message: 'POST to auto-approve all pending analyses and create Phase 1 tasks',
    endpoint: '/api/marketplace/recover/auto-approve',
    method: 'POST',
    requires: 'admin or head role',
    warning: '⚠️ Development endpoint - will auto-approve ALL pending analyses',
  });
}
