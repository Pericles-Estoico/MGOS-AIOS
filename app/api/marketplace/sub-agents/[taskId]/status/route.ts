/**
 * API Route: /api/marketplace/sub-agents/[taskId]/status
 * GET - Get status of all subtasks for a parent task
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSubAgentOrchestrator } from '@lib/marketplace-orchestration/services/sub-agent-orchestrator';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
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

    // 2. Validate task ID
    if (!params.taskId || typeof params.taskId !== 'string') {
      return NextResponse.json(
        { error: 'taskId é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Get all subtasks status
    const orchestrator = getSubAgentOrchestrator();
    const subtasks = await orchestrator.getSubtasksStatus(params.taskId);

    // 4. Calculate summary
    const summary = {
      total: subtasks.length,
      pending: subtasks.filter((s) => s.status === 'pending').length,
      in_progress: subtasks.filter((s) => s.status === 'in_progress').length,
      awaiting_checkpoint: subtasks.filter(
        (s) => s.status === 'awaiting_checkpoint'
      ).length,
      completed: subtasks.filter((s) => s.status === 'completed').length,
      failed: subtasks.filter((s) => s.status === 'failed').length,
    };

    // 5. Find next checkpoint
    const nextCheckpoint = subtasks.find(
      (s) => s.status === 'awaiting_checkpoint'
    );

    return NextResponse.json(
      {
        success: true,
        task_id: params.taskId,
        summary,
        subtasks: subtasks.map((s) => ({
          id: s.id,
          type: s.type,
          title: s.title,
          status: s.status,
          sub_agent_id: s.sub_agent_id,
          order_index: s.order_index,
          created_at: s.created_at,
          updated_at: s.updated_at,
        })),
        next_checkpoint: nextCheckpoint
          ? {
              id: nextCheckpoint.id,
              type: nextCheckpoint.type,
              title: nextCheckpoint.title,
              checkpoint_data: nextCheckpoint.checkpoint_data,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `/api/marketplace/sub-agents/[taskId]/status error:`,
      error
    );
    return NextResponse.json(
      {
        error: 'Erro ao buscar status das subtarefas',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
