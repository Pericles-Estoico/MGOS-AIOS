/**
 * Analytics Metrics API Endpoint
 * Story 3.6: Analytics Data Aggregation Phase 2
 *
 * GET /api/analytics/metrics?days=30&userId=xyz
 * Returns: { period, perUserMetrics, teamMetrics, qaMetrics }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAnalyticsMetrics,
  canAccessTeamMetrics,
  canAccessUserMetrics,
  clearAnalyticsCache,
  AnalyticsResponse,
} from '@/lib/analytics-service';

// ============================================================================
// Type Definitions
// ============================================================================

interface AuthRequest {
  userId?: string;
  userRole?: string;
}

// ============================================================================
// Helper: Extract Auth from Bearer Token
// ============================================================================

function extractAuthFromHeader(authHeader?: string): AuthRequest {
  if (!authHeader?.startsWith('Bearer ')) {
    return {};
  }

  const token = authHeader.substring('Bearer '.length);
  // In production, verify JWT here
  // For now, assume token contains user info encoded (simplified)
  // Real implementation would verify JWT signature

  return {
    userId: token.split(':')[0] || undefined,
    userRole: token.split(':')[1] || undefined,
  };
}

// ============================================================================
// Helper: Validate Query Parameters
// ============================================================================

function validateQueryParams(
  daysParam?: string,
  startParam?: string,
  endParam?: string
): {
  days?: number;
  customStart?: Date;
  customEnd?: Date;
  error?: string;
} {
  const result: any = {};

  // Validate days parameter
  if (daysParam) {
    const days = parseInt(daysParam, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      return { error: 'days must be between 1 and 365' };
    }
    result.days = days;
  }

  // Validate custom date range
  if (startParam || endParam) {
    if (startParam) {
      const start = new Date(startParam);
      if (isNaN(start.getTime())) {
        return { error: 'startDate must be valid ISO 8601 date' };
      }
      result.customStart = start;
    }

    if (endParam) {
      const end = new Date(endParam);
      if (isNaN(end.getTime())) {
        return { error: 'endDate must be valid ISO 8601 date' };
      }
      result.customEnd = end;
    }

    // Validate range
    if (result.customStart && result.customEnd) {
      if (result.customStart > result.customEnd) {
        return { error: 'startDate must be before endDate' };
      }

      const diffDays = Math.floor(
        (result.customEnd.getTime() - result.customStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays > 365) {
        return { error: 'date range cannot exceed 365 days' };
      }
    }
  }

  // Default to 30 days if no range specified
  if (!result.days && !result.customStart && !result.customEnd) {
    result.days = 30;
  }

  return result;
}

// ============================================================================
// GET Handler
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract authentication
    const authHeader = request.headers.get('Authorization') || '';
    const auth = extractAuthFromHeader(authHeader);

    if (!auth.userId) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days') || undefined;
    const startParam = searchParams.get('startDate') || undefined;
    const endParam = searchParams.get('endDate') || undefined;
    const userIdParam = searchParams.get('userId') || undefined;
    const clearCache = searchParams.get('clearCache') === 'true';

    // Clear cache if requested (admin only)
    if (clearCache && canAccessTeamMetrics(auth.userRole)) {
      clearAnalyticsCache();
    }

    // Validate date range parameters
    const dateValidation = validateQueryParams(daysParam, startParam, endParam);
    if (dateValidation.error) {
      return NextResponse.json({ error: dateValidation.error }, { status: 400 });
    }

    // Authorization: Check if user can access requested metrics
    const requestedUserId = userIdParam || auth.userId;

    // If requesting specific user metrics, check authorization
    if (userIdParam && !canAccessUserMetrics(userIdParam, auth.userId, auth.userRole)) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot access other users metrics' },
        { status: 403 }
      );
    }

    // Fetch metrics
    const metrics = await getAnalyticsMetrics({
      days: dateValidation.days,
      customStart: dateValidation.customStart,
      customEnd: dateValidation.customEnd,
      userId: requestedUserId,
      userRole: auth.userRole,
    });

    // Filter response based on authorization
    const response: AnalyticsResponse = {
      period: metrics.period,
      perUserMetrics: metrics.perUserMetrics,
      teamMetrics: metrics.teamMetrics,
      qaMetrics: metrics.qaMetrics,
    };

    // Only include team metrics if user is authorized
    if (!canAccessTeamMetrics(auth.userRole)) {
      response.teamMetrics = {
        totalTasks: 0,
        avgDailyCompletion: 0,
        burndownTrend: [],
        teamAvgTime: 0,
        overallSuccessRate: 0,
      };

      response.qaMetrics = {
        avgReviewTime: 0,
        pendingReviews: 0,
        reviewSLA: 0,
      };
    }

    // Record API access in audit log (optional, for tracking)
    // await logApiAccess(auth.userId, '/api/analytics/metrics', 'GET', 200);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/analytics/metrics:', error);

    return NextResponse.json(
      {
        error: 'Failed to retrieve analytics metrics',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST Handler: Invalidate Cache (Admin Only)
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract authentication
    const authHeader = request.headers.get('Authorization') || '';
    const auth = extractAuthFromHeader(authHeader);

    if (!auth.userId) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    // Only admin can manually invalidate cache
    if (!canAccessTeamMetrics(auth.userRole)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can invalidate cache' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, pattern } = body;

    if (action === 'invalidate') {
      clearAnalyticsCache();
      return NextResponse.json(
        { message: 'Analytics cache invalidated successfully' },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/analytics/metrics:', error);

    return NextResponse.json(
      {
        error: 'Failed to process analytics request',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS Handler (CORS Preflight)
// ============================================================================

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({}, { status: 200 });
}
