/**
 * NEXO Orchestration Alerts - Notificações de problemas
 * POST /api/marketplace/orchestration/alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';

interface AlertPayload {
  type: 'bottleneck' | 'low_performance' | 'high_error_rate' | 'system_health_degraded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  agentId?: string;
  metrics?: Record<string, any>;
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only QA and admin can create alerts
    const role = session.user.role as string;
    if (!['admin', 'head', 'qa'].includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - only admin/head/qa can manage alerts' },
        { status: 403 }
      );
    }

    const body: AlertPayload = await request.json();

    // Validate alert
    if (!body.type || !body.severity || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, severity, message' },
        { status: 400 }
      );
    }

    const alertId = `alert-${Date.now()}`;
    const timestamp = body.timestamp || new Date().toISOString();

    console.log(`🚨 NEXO Alert [${body.severity.toUpperCase()}]: ${body.message}`);
    console.log(`   Type: ${body.type}`);
    if (body.agentId) console.log(`   Agent: ${body.agentId}`);
    if (body.metrics) console.log(`   Metrics:`, body.metrics);

    // In production, would send to:
    // - Email notification service
    // - Slack webhook
    // - SMS/SMS service
    // - In-app notification system

    return NextResponse.json({
      status: 'success',
      alertId,
      timestamp,
      message: 'Alert recorded successfully',
      alert: {
        id: alertId,
        ...body,
        timestamp,
      },
    });
  } catch (error) {
    console.error('Alert creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create alert',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only QA and admin can view alerts
    const role = session.user.role as string;
    if (!['admin', 'head', 'qa'].includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - only admin/head/qa can view alerts' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const severity = searchParams.get('severity');
    const agentId = searchParams.get('agent');
    const limit = parseInt(searchParams.get('limit') || '50');

    // In production, would fetch from database
    // For now, return empty list (alerts would be persisted in DB)

    return NextResponse.json({
      status: 'success',
      alerts: [],
      filters: {
        severity: severity || 'all',
        agent: agentId || 'all',
        limit,
      },
      message: 'No active alerts',
    });
  } catch (error) {
    console.error('Alert fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch alerts',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
