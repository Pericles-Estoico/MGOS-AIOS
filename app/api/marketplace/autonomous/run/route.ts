import { runAutonomousLoop, generateLoopSummary } from '@lib/ai/agent-loop';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/marketplace/autonomous/run
 * Trigger autonomous agent loop to generate optimization tasks
 * Requires authentication (admin or head role only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado - autenticação necessária', message: 'Faça login para executar o loop autônomo' },
        { status: 401 }
      );
    }

    // Check authorization (only admin and head can run autonomous loop)
    const userRole = (session.user as unknown as Record<string, unknown>)?.role;
    if (!userRole || !['admin', 'head'].includes(userRole as string)) {
      return NextResponse.json(
        { error: 'Acesso negado', message: 'Apenas admin e head podem executar o loop autônomo' },
        { status: 403 }
      );
    }

    const result = await runAutonomousLoop();
    const summary = generateLoopSummary(result);

    return NextResponse.json(
      {
        success: true,
        execution: result,
        summary,
        message: `Loop executado com sucesso. ${result.totalTasks} tarefas foram geradas.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error running autonomous loop:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Erro ao executar loop autônomo',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/autonomous/run
 * Get information about the autonomous loop
 */
export async function GET() {
  return NextResponse.json(
    {
      description: 'Autonomous marketplace agent loop',
      endpoint: 'POST /api/marketplace/autonomous/run',
      what_it_does:
        'Triggers all 6 marketplace agents to analyze metrics and generate optimization tasks',
      agents: [
        'Alex (Amazon)',
        'Marina (MercadoLivre)',
        'Sunny (Shopee)',
        'Tren (Shein)',
        'Viral (TikTok Shop)',
        'Premium (Kaway)',
      ],
      response_time_seconds: '30-60',
    },
    { status: 200 }
  );
}
