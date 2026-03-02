/**
 * API Route: /api/marketplace/sub-agents/[taskId]/results
 * GET - Get consolidated results from all completed subtasks
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

    // 3. Get consolidated results
    const orchestrator = getSubAgentOrchestrator();
    const results = await orchestrator.getConsolidatedResults(params.taskId);

    // 4. Determine overall status
    const subtasks = await orchestrator.getSubtasksStatus(params.taskId);
    const allCompleted = subtasks.every((s) => s.status === 'completed');
    const anyFailed = subtasks.some((s) => s.status === 'failed');

    const overallStatus = anyFailed
      ? 'failed'
      : allCompleted
        ? 'completed'
        : 'in_progress';

    return NextResponse.json(
      {
        success: true,
        task_id: params.taskId,
        overall_status: overallStatus,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `/api/marketplace/sub-agents/[taskId]/results error:`,
      error
    );
    return NextResponse.json(
      {
        error: 'Erro ao buscar resultados consolidados',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
