/**
 * GET /api/marketplace/jobs/[jobId]
 * Poll job status for Phase 1 task creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getJobStatus } from '@lib/queue/phase1-queue';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
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

    const jobId = params.jobId;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID é obrigatório' },
        { status: 400 }
      );
    }

    // Get job status from queue
    const jobStatus = await getJobStatus(jobId);

    if (!jobStatus) {
      return NextResponse.json(
        { error: 'Job não encontrado' },
        { status: 404 }
      );
    }

    // Map BullMQ state to user-friendly status
    const stateMap: Record<string, string> = {
      waiting: 'pending',
      active: 'processing',
      completed: 'completed',
      failed: 'failed',
      delayed: 'scheduled',
      paused: 'paused',
    };

    const userStatus = stateMap[jobStatus.status as string] || jobStatus.status;

    // Build response with different data depending on state
    const response: any = {
      id: jobStatus.id,
      status: userStatus,
      progress: jobStatus.progress || 0,
      attempts: jobStatus.attempts,
      maxAttempts: jobStatus.maxAttempts,
      createdAt: jobStatus.createdAt,
    };

    // Add result or error based on state
    if (jobStatus.status === 'completed') {
      response.result = jobStatus.result;
      response.message = 'Tarefas de Fase 1 criadas com sucesso';
    } else if (jobStatus.status === 'failed') {
      response.error = jobStatus.error;
      response.message = 'Falha ao processar tarefas de Fase 1';
    } else {
      response.message = `Job em estado: ${userStatus}`;
    }

    // Return appropriate HTTP status
    const httpStatus =
      jobStatus.status === 'completed'
        ? 200
        : jobStatus.status === 'failed'
          ? 500
          : 202;

    return NextResponse.json(response, { status: httpStatus });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar status do job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
