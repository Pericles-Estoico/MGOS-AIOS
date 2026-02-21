/**
 * Analytics Service — Task & User Metrics Aggregation
 * Story 3.6: Analytics Data Aggregation Phase 2
 *
 * Computes per-user, team, and QA metrics from audit logs
 * with in-memory caching (5 min TTL) for performance optimization
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Cache Management
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MetricsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

const metricsCache = new MetricsCache();

// ============================================================================
// Type Definitions
// ============================================================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PerUserMetrics {
  userId: string;
  displayName?: string;
  taskCount: number;
  avgCompletionTime: number; // hours
  totalHours: number;
  approvalRate: number; // 0-100
  rejectionRate: number; // 0-100
  lastCompleted?: Date;
}

export interface TeamMetrics {
  totalTasks: number;
  avgDailyCompletion: number;
  burndownTrend: Array<{
    date: string; // YYYY-MM-DD
    tasksCompleted: number;
  }>;
  teamAvgTime: number; // hours
  overallSuccessRate: number; // 0-100
}

export interface QAMetrics {
  avgReviewTime: number; // hours
  pendingReviews: number;
  reviewSLA: number; // 0-100 (% completed < 24h)
}

export interface AnalyticsResponse {
  period: DateRange;
  perUserMetrics: PerUserMetrics[];
  teamMetrics: TeamMetrics;
  qaMetrics: QAMetrics;
}

// ============================================================================
// Supabase Client
// ============================================================================

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return supabaseClient;
}

// ============================================================================
// Authorization Helpers
// ============================================================================

export function canAccessTeamMetrics(userRole?: string): boolean {
  return userRole === 'admin' || userRole === 'head';
}

export function canAccessUserMetrics(
  requestedUserId: string,
  currentUserId: string,
  userRole?: string
): boolean {
  // Admin/head can access any user's metrics
  if (canAccessTeamMetrics(userRole)) {
    return true;
  }
  // Users can only access their own metrics
  return requestedUserId === currentUserId;
}

// ============================================================================
// Date Range Helpers
// ============================================================================

export function parseDateRange(days?: number, customStart?: Date, customEnd?: Date): DateRange {
  const end = customEnd || new Date();
  const start = customStart || new Date(end);

  if (days) {
    start.setDate(end.getDate() - days);
  }

  // Reset time to start of day for consistent queries
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// ============================================================================
// Core Metric Calculations
// ============================================================================

/**
 * Calculate per-user metrics from audit logs
 * Queries: task count, avg completion time, approval/rejection rates
 */
export async function calculatePerUserMetrics(
  dateRange: DateRange,
  specificUserId?: string
): Promise<PerUserMetrics[]> {
  const cacheKey = `per-user-metrics-${dateRange.start.toISOString()}-${dateRange.end.toISOString()}-${specificUserId || 'all'}`;
  const cached = metricsCache.get<PerUserMetrics[]>(cacheKey);
  if (cached) return cached;

  const supabase = getSupabaseClient();

  try {
    // Query 1: Get per-user metrics (counts, avg time, rates)
    const { data, error } = await supabase
      .rpc('calculate_per_user_metrics', {
        date_start: dateRange.start.toISOString(),
        date_end: dateRange.end.toISOString(),
        user_id_filter: specificUserId || null,
      } as any)
      .select('*');

    if (error) {
      console.error('Error calculating per-user metrics:', error);
      throw error;
    }

    const metrics: PerUserMetrics[] = ((data || []) as unknown[]).map((row: any) => ({
      userId: row.user_id,
      displayName: row.display_name,
      taskCount: row.task_count || 0,
      avgCompletionTime: parseFloat(row.avg_completion_time) || 0,
      totalHours: parseFloat(row.total_hours) || 0,
      approvalRate: parseFloat(row.approval_rate) || 0,
      rejectionRate: parseFloat(row.rejection_rate) || 0,
      lastCompleted: row.last_completed ? new Date(row.last_completed) : undefined,
    }));

    metricsCache.set(cacheKey, metrics);
    return metrics;
  } catch (err) {
    console.error('Unexpected error in calculatePerUserMetrics:', err);
    throw new Error(`Failed to calculate per-user metrics: ${(err as Error).message}`);
  }
}

/**
 * Calculate team metrics for the given date range
 * Queries: total tasks, daily completion, burndown trend, success rate
 */
export async function calculateTeamMetrics(dateRange: DateRange): Promise<TeamMetrics> {
  const cacheKey = `team-metrics-${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`;
  const cached = metricsCache.get<TeamMetrics>(cacheKey);
  if (cached) return cached;

  const supabase = getSupabaseClient();

  try {
    // Query: Get team-level metrics and burndown trend
    const { data, error } = await supabase
      .rpc('calculate_team_metrics', {
        date_start: dateRange.start.toISOString(),
        date_end: dateRange.end.toISOString(),
      } as any)
      .select('*');

    if (error) {
      console.error('Error calculating team metrics:', error);
      throw error;
    }

    const row = (((data || []) as unknown[])?.[0] || {}) as Record<string, unknown>;

    // Parse burndown trend from JSON array
    const burndownTrend = Array.isArray(row.burndown_trend)
      ? row.burndown_trend.map((item: any) => ({
          date: item.date,
          tasksCompleted: item.tasks_completed || 0,
        }))
      : [];

    const metrics: TeamMetrics = {
      totalTasks: (row.total_tasks as unknown as number) || 0,
      avgDailyCompletion: parseFloat(row.avg_daily_completion as unknown as string) || 0,
      burndownTrend,
      teamAvgTime: parseFloat(row.team_avg_time as unknown as string) || 0,
      overallSuccessRate: parseFloat(row.overall_success_rate as unknown as string) || 0,
    };

    metricsCache.set(cacheKey, metrics);
    return metrics;
  } catch (err) {
    console.error('Unexpected error in calculateTeamMetrics:', err);
    throw new Error(`Failed to calculate team metrics: ${(err as Error).message}`);
  }
}

/**
 * Calculate QA review metrics
 * Queries: avg review time, pending reviews, SLA compliance
 */
export async function calculateQAMetrics(dateRange: DateRange): Promise<QAMetrics> {
  const cacheKey = `qa-metrics-${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`;
  const cached = metricsCache.get<QAMetrics>(cacheKey);
  if (cached) return cached;

  const supabase = getSupabaseClient();

  try {
    // Query: Get QA metrics (review time, SLA)
    const { data, error } = await supabase
      .rpc('calculate_qa_metrics', {
        date_start: dateRange.start.toISOString(),
        date_end: dateRange.end.toISOString(),
      } as any)
      .select('*');

    if (error) {
      console.error('Error calculating QA metrics:', error);
      throw error;
    }

    const row = (((data || []) as unknown[])?.[0] || {}) as Record<string, unknown>;

    const metrics: QAMetrics = {
      avgReviewTime: parseFloat(row.avg_review_time as unknown as string) || 0,
      pendingReviews: (row.pending_reviews as unknown as number) || 0,
      reviewSLA: parseFloat(row.review_sla as unknown as string) || 0,
    };

    metricsCache.set(cacheKey, metrics);
    return metrics;
  } catch (err) {
    console.error('Unexpected error in calculateQAMetrics:', err);
    throw new Error(`Failed to calculate QA metrics: ${(err as Error).message}`);
  }
}

// ============================================================================
// Main Analytics Function
// ============================================================================

/**
 * Main function to get all analytics metrics for a date range
 * Optionally filters per-user metrics by userId
 */
export async function getAnalyticsMetrics(options: {
  days?: number;
  customStart?: Date;
  customEnd?: Date;
  userId?: string; // Filter per-user metrics to specific user
  userRole?: string; // For authorization checks
}): Promise<AnalyticsResponse> {
  const dateRange = parseDateRange(options.days, options.customStart, options.customEnd);

  try {
    // Fetch all metric types in parallel
    const [perUserMetrics, teamMetrics, qaMetrics] = await Promise.all([
      calculatePerUserMetrics(dateRange, options.userId),
      calculateTeamMetrics(dateRange),
      calculateQAMetrics(dateRange),
    ]);

    return {
      period: dateRange,
      perUserMetrics,
      teamMetrics,
      qaMetrics,
    };
  } catch (err) {
    console.error('Error in getAnalyticsMetrics:', err);
    throw new Error(`Failed to retrieve analytics metrics: ${(err as Error).message}`);
  }
}

// ============================================================================
// Cache Management Public API
// ============================================================================

export function clearAnalyticsCache(): void {
  metricsCache.clear();
}

export function invalidateMetricsCache(pattern?: string): void {
  if (!pattern) {
    clearAnalyticsCache();
  }
  // Selective invalidation can be implemented if needed
}
