/**
 * Activate NEXO Marketplace Orchestration
 * Triggers all 6 marketplace agents to generate tasks
 * POST /api/marketplace/orchestration/activate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import { nexoOrchestrator } from '@lib/marketplace-orchestration/services/agent-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and heads can activate orchestration
    const role = session.user.role as string;
    if (!['admin', 'head'].includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - only admin/head can activate orchestration' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const channels = body.channels || [];

    console.log(`🌐 [API] Activating NEXO orchestration for channels: ${channels.join(', ') || 'all'}`);

    const plan = await nexoOrchestrator.activateOrchestation(channels);

    return NextResponse.json({
      status: 'success',
      message: 'Orchestration activated',
      plan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Orchestration activation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to activate orchestration',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
