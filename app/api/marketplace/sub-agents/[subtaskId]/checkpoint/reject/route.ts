/**
 * API Route: /api/marketplace/sub-agents/[subtaskId]/checkpoint/reject
 * POST - Reject checkpoint and reset subtask for re-execution
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSubAgentOrchestrator } from '@lib/marketplace-orchestration/services/sub-agent-orchestrator';
import { enqueueSubAgentJob } from '@lib/queue/sub-agent-queue';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
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
    const { reason } = body;

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'reason é obrigatório para rejeição' },
        { status: 400 }
      );
    }

    // 4. Get subtask
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
        { error: `Cannot reject checkpoint: subtask status is ${subtask.status}` },
        { status: 400 }
      );
    }

    // 5. Reject checkpoint and reset subtask
    const rejected = await orchestrator.rejectCheckpoint(
      params.subtaskId,
      session.user?.id || ''
    );

    // 6. Log the rejection reason
    console.log(
      `❌ Checkpoint rejected for subtask ${params.subtaskId}: ${reason}`
    );

    // 7. Queue subtask for re-execution
    const jobId = await enqueueSubAgentJob({
      subtask_id: params.subtaskId,
      task_id: subtask.parent_task_id,
      action: 'execute_subtask',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Checkpoint rejeitado - subtarefa será re-executada',
        subtask_id: params.subtaskId,
        rejected_by: session.user?.id,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
        requeue_job_id: jobId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `/api/marketplace/sub-agents/[subtaskId]/checkpoint/reject error:`,
      error
    );
    return NextResponse.json(
      {
        error: 'Erro ao rejeitar checkpoint',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
