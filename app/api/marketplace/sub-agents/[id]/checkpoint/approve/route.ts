/**
 * API Route: /api/marketplace/sub-agents/[subtaskId]/checkpoint/approve
 * POST - Approve checkpoint and proceed to next subtask
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSubAgentOrchestrator } from '@lib/marketplace-orchestration/services/sub-agent-orchestrator';
import { enqueueSubAgentJob } from '@lib/queue/sub-agent-queue';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase configuration');
  return createClient(url, key);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
    const supabase = getSupabase();
    // 1. Authenticate user
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado - por favor, faça login' },
        { status: 401 }
      );
    }

    // 2. Validate subtask ID
    if (!params.subtaskId || typeof params.subtaskId !== 'string') {
      return NextResponse.json(
        { error: 'subtaskId é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { notes } = body;

    // 4. Get subtask to find parent task
    const orchestrator = getSubAgentOrchestrator();
    const subtask = await orchestrator.getSubtask(params.subtaskId);

    if (!subtask) {
      return NextResponse.json(
        { error: 'Subtask not found' },
        { status: 404 }
      );
    }

    if (subtask.status !== 'awaiting_checkpoint') {
      return NextResponse.json(
        { error: `Cannot approve checkpoint: subtask status is ${subtask.status}` },
        { status: 400 }
      );
    }

    // 5. Approve checkpoint
    const approved = await orchestrator.approveCheckpoint(
      params.subtaskId,
      session.user?.id || '',
      notes
    );

    // 6. Find next pending subtask
    const { data: nextSubtask } = await supabase
      .from('marketplace_subtasks')
      .select('*')
      .eq('parent_task_id', subtask.parent_task_id)
      .eq('status', 'pending')
      .order('order_index', { ascending: true })
      .limit(1)
      .single();

    let nextJobId: string | null = null;

    // 7. If next subtask exists, queue it
    if (nextSubtask) {
      nextJobId = await enqueueSubAgentJob({
        subtask_id: nextSubtask.id,
        task_id: subtask.parent_task_id,
        action: 'execute_subtask',
      });

      console.log(`✅ Next subtask queued: ${nextSubtask.id}`);
    } else {
      console.log(
        `✅ All subtasks completed for parent task: ${subtask.parent_task_id}`
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Checkpoint aprovado com sucesso',
        subtask_id: params.subtaskId,
        approved_by: session.user?.id,
        approved_at: new Date().toISOString(),
        next_subtask_id: nextSubtask?.id || null,
        next_job_id: nextJobId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `/api/marketplace/sub-agents/[subtaskId]/checkpoint/approve error:`,
      error
    );
    return NextResponse.json(
      {
        error: 'Erro ao aprovar checkpoint',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
