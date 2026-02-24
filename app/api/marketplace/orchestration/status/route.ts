/**
 * Get NEXO Orchestration Status
 * Returns status of all 6 marketplace agents
 * GET /api/marketplace/orchestration/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import { nexoOrchestrator } from '@lib/marketplace-orchestration/services/agent-orchestrator';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`📊 [API] Fetching NEXO agent status`);

    const statuses = await nexoOrchestrator.getAgentsStatus();
    const report = await nexoOrchestrator.generateReport();

    // Calculate summary stats
    const summary = {
      totalAgents: statuses.length,
      activeAgents: statuses.filter(s => s.status === 'active').length,
      totalTasksGenerated: statuses.reduce((sum, s) => sum + s.tasksGenerated, 0),
      totalTasksApproved: statuses.reduce((sum, s) => sum + s.tasksApproved, 0),
      totalTasksCompleted: statuses.reduce((sum, s) => sum + s.tasksCompleted, 0),
      overallSuccessRate: statuses.length > 0
        ? (statuses.reduce((sum, s) => sum + s.successRate, 0) / statuses.length).toFixed(1)
        : 0,
    };

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      summary,
      agents: statuses,
      report,
    });
  } catch (error) {
    console.error('Status fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch orchestration status',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
