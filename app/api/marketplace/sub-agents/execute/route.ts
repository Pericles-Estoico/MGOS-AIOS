/**
 * API Route: /api/marketplace/sub-agents/execute
 * POST - Initiate sub-agent decomposition after task approval
 *
 * Decomposes an approved task into subtasks and queues first subtask
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSubAgentOrchestrator } from '@lib/marketplace-orchestration/services/sub-agent-orchestrator';
import { enqueueSubAgentJob } from '@lib/queue/sub-agent-queue';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado - por favor, faça login' },
        { status: 401 }
      );
    }

    // 2. Check admin role
    if (session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem iniciar decomposição de tarefas' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { task_id } = body;

    if (!task_id || typeof task_id !== 'string') {
      return NextResponse.json(
        { error: 'task_id é obrigatório e deve ser string' },
        { status: 400 }
      );
    }

    // 4. Decompose task into subtasks
    const orchestrator = getSubAgentOrchestrator();
    const subtaskIds = await orchestrator.decomposeTask(task_id);

    if (subtaskIds.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma subtarefa foi criada' },
        { status: 500 }
      );
    }

    // 5. Queue first subtask for execution
    const firstSubtaskId = subtaskIds[0];
    const jobId = await enqueueSubAgentJob({
      subtask_id: firstSubtaskId,
      task_id,
      action: 'execute_subtask',
    });

    console.log(
      `✅ Task decomposition initiated: ${subtaskIds.length} subtasks created`
    );

    return NextResponse.json(
      {
        success: true,
        message: `Tarefa decomposta em ${subtaskIds.length} subtarefas`,
        task_id,
        subtask_ids: subtaskIds,
        first_job_id: jobId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('/api/marketplace/sub-agents/execute error:', error);
    return NextResponse.json(
      {
        error: 'Erro ao iniciar decomposição',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
