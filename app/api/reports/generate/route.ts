import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { createSupabaseServerClient } from '@/lib/supabase';
import type { Session } from 'next-auth';

interface ReportRequest {
  type: 'sprint' | 'team' | 'individual' | 'custom';
  sprintId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  grouping?: 'hour' | 'day' | 'week' | 'month';
}

interface ReportData {
  type: string;
  period?: string;
  userId?: string;
  summary: Record<string, unknown>;
  statusDistribution?: Record<string, number>;
  priorityDistribution?: Record<string, number>;
  metrics?: unknown;
  statusBreakdown?: Record<string, number>;
  generatedAt: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    if (!['admin', 'head'].includes(session?.user?.role || '')) {
      return Response.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body: ReportRequest = await request.json();
    const supabase = createSupabaseServerClient((session as any).accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    let data: ReportData | null = null;

    switch (body.type) {
      case 'sprint':
        data = await generateSprintReport(supabase, body);
        break;
      case 'team':
        data = await generateTeamReport(supabase, body);
        break;
      case 'individual':
        data = await generateIndividualReport(supabase, body);
        break;
      case 'custom':
        data = await generateCustomReport(supabase, body);
        break;
      default:
        return Response.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return Response.json({ data });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateSprintReport(
  supabase: any,
  params: ReportRequest
): Promise<ReportData> {
  if (!params.sprintId) throw new Error('Sprint ID required');

  const { data: tasks } = await (supabase as unknown as any)
    .from('tasks')
    .select('status, priority, assigned_to, created_at, updated_at')
    .eq('sprint_id', params.sprintId);

  const statusCounts: Record<string, number> = {
    pending: 0,
    in_progress: 0,
    submitted: 0,
    qa_review: 0,
    approved: 0,
    rejected: 0,
  };

  const priorityCounts: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  const taskList = (tasks || []) as any[];
  taskList.forEach((task: any) => {
    if (statusCounts[task.status] !== undefined) {
      statusCounts[task.status]++;
    }
    if (priorityCounts[task.priority] !== undefined) {
      priorityCounts[task.priority]++;
    }
  });

  return {
    type: 'sprint',
    period: params.sprintId,
    summary: {
      totalTasks: taskList?.length || 0,
      completionRate: taskList?.length
        ? Math.round(
            ((taskList.filter((t: any) => t.status === 'approved').length /
              taskList.length) *
              100)
          )
        : 0,
    },
    statusDistribution: statusCounts,
    priorityDistribution: priorityCounts,
    generatedAt: new Date().toISOString(),
  };
}

async function generateTeamReport(
  supabase: any,
  params: ReportRequest
): Promise<ReportData> {
  const { data: teamMetrics } = await (supabase as unknown as any)
    .from('team_metrics')
    .select('*')
    .eq('sprint_id', params.sprintId || null)
    .order('captured_at', { ascending: false })
    .limit(1);

  const metricList = (teamMetrics || []) as any[];
  const metric = metricList?.[0];

  return {
    type: 'team',
    summary: {
      totalTasks: metric?.total_tasks || 0,
      completed: metric?.completed_tasks || 0,
      inProgress: metric?.in_progress_tasks || 0,
      blocked: metric?.blocked_tasks || 0,
      completionRate: metric?.total_tasks
        ? Math.round(((metric.completed_tasks / metric.total_tasks) * 100))
        : 0,
      qualityScore: metric?.quality_score || 0,
    },
    metrics: metric,
    generatedAt: new Date().toISOString(),
  };
}

async function generateIndividualReport(
  supabase: any,
  params: ReportRequest
): Promise<ReportData> {
  if (!params.userId) throw new Error('User ID required');

  const { data: userMetrics } = await (supabase as unknown as any)
    .from('user_metrics')
    .select('*')
    .eq('user_id', params.userId)
    .eq('sprint_id', params.sprintId || null)
    .order('captured_at', { ascending: false })
    .limit(1);

  const metricList = (userMetrics || []) as any[];
  const metric = metricList?.[0];

  return {
    type: 'individual',
    userId: params.userId,
    summary: {
      tasksCompleted: metric?.tasks_completed || 0,
      tasksInProgress: metric?.tasks_in_progress || 0,
      qualityScore: metric?.quality_score || 0,
      productivityIndex: metric?.productivity_index || 0,
    },
    metrics: metric,
    generatedAt: new Date().toISOString(),
  };
}

async function generateCustomReport(
  supabase: any,
  params: ReportRequest
): Promise<ReportData> {
  const startDate = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = params.endDate || new Date().toISOString();

  const { data: taskMetrics } = await (supabase as unknown as any)
    .from('task_metrics')
    .select('*')
    .gte('captured_at', startDate)
    .lte('captured_at', endDate)
    .order('captured_at', { ascending: false });

  const metricList = (taskMetrics || []) as any[];
  const statusBreakdown: Record<string, number> = metricList.reduce((acc: Record<string, number>, metric: any) => {
    const status = metric.final_status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const avgEstimate = metricList?.length
    ? metricList.reduce((sum: number, m: any) => sum + (m.estimate_hours || 0), 0) / metricList.length
    : 0;

  const avgActual = metricList?.length
    ? metricList.reduce((sum: number, m: any) => sum + (m.actual_hours || 0), 0) / metricList.length
    : 0;

  return {
    type: 'custom',
    period: `${startDate} to ${endDate}`,
    summary: {
      taskCount: metricList?.length || 0,
      avgEstimate: Math.round(avgEstimate * 100) / 100,
      avgActual: Math.round(avgActual * 100) / 100,
      accuracyRate: avgEstimate ? Math.round(((1 - Math.abs(avgActual - avgEstimate) / avgEstimate) * 100)) : 0,
    },
    statusBreakdown,
    metrics: metricList,
    generatedAt: new Date().toISOString(),
  };
}
