/**
 * Health check endpoint for Redis connection
 * GET /api/health/redis
 *
 * Returns connection status, latency, and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRedisHealth, getRedisMetrics } from '@/lib/redis-client';

export async function GET() {
  try {
    // Check Redis connectivity
    const healthCheck = await checkRedisHealth();

    // Get current metrics
    const metrics = getRedisMetrics();

    // Build response
    const response = {
      status: healthCheck.status,
      latency: `${healthCheck.latency}ms`,
      timestamp: new Date().toISOString(),
      metrics: {
        connections: metrics.connections,
        commands: metrics.commands,
        errors: metrics.errors,
        averageLatency: `${metrics.averageLatency}ms`,
      },
      message:
        healthCheck.status === 'connected'
          ? '✅ Redis is healthy'
          : '❌ Redis connection failed',
    };

    // Return appropriate status code
    const statusCode = healthCheck.status === 'connected' ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        status: 'error',
        message: '❌ Health check failed',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST for manual health check trigger (useful for monitoring systems)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
