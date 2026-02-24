/**
 * Get NEXO Performance Metrics
 * Returns comprehensive performance metrics for all agents and channels
 * GET /api/marketplace/orchestration/metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import { performanceMonitor } from '@lib/marketplace-orchestration/services/performance-monitor';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and qa can view metrics
    const role = session.user.role as string;
    if (!['admin', 'head', 'qa'].includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - only admin/head/qa can view metrics' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agent');
    const channel = searchParams.get('channel');

    console.log(`📈 [API] Fetching performance metrics - agent: ${agentId}, channel: ${channel}`);

    // Get metrics based on query params
    if (agentId) {
      // Get metrics for specific agent
      const agentMetrics = await performanceMonitor.getAgentMetrics(agentId as any);
      return NextResponse.json({
        status: 'success',
        type: 'agent',
        metrics: agentMetrics,
        timestamp: new Date().toISOString(),
      });
    }

    if (channel) {
      // Get metrics for specific channel
      const channelPerformance = await performanceMonitor.getChannelPerformance(channel);
      return NextResponse.json({
        status: 'success',
        type: 'channel',
        metrics: channelPerformance,
        timestamp: new Date().toISOString(),
      });
    }

    // Get all metrics (system-wide)
    const allAgentMetrics = await performanceMonitor.getAllAgentMetrics();
    const systemMetrics = await performanceMonitor.getSystemMetrics();
    const report = await performanceMonitor.generatePerformanceReport();

    return NextResponse.json({
      status: 'success',
      type: 'system',
      system: systemMetrics,
      agents: allAgentMetrics,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Metrics fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
