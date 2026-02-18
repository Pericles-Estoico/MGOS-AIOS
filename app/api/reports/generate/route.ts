import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

interface ReportRequest {
  type: 'sprint' | 'team' | 'individual' | 'custom';
  sprintId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  grouping?: 'hour' | 'day' | 'week' | 'month';
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
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
    const supabase = createSupabaseServerClient(session.accessToken);

    let data: any = {};

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

async function generateSprintReport(supabase: any, params: ReportRequest) {
  if (!params.sprintId) throw new Error('Sprint ID required');

  const { data: tasks } = await supabase
    .from('tasks')
    .select('status, priority, assigned_to, created_at, updated_at')
    .eq('sprint_id', params.sprintId);

  const statusCounts = {
    pending: 0,
    in_progress: 0,
    submitted: 0,
    qa_review: 0,
    approved: 0,
    rejected: 0,
  };

  const priorityCounts = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  tasks?.forEach((task: any) => {
    statusCounts[task.status as keyof typeof statusCounts]++;
    priorityCounts[task.priority as keyof typeof priorityCounts]++;
  });

  return {
    type: 'sprint',
    period: params.sprintId,
    summary: {
      totalTasks: tasks?.length || 0,
      completionRate: tasks?.length
        ? Math.round(
            ((tasks.filter((t: any) => t.status === 'approved').length /
              tasks.length) *
              100)
          )
        : 0,
    },
    statusDistribution: statusCounts,
    priorityDistribution: priorityCounts,
    generatedAt: new Date().toISOString(),
  };
}

async function generateTeamReport(supabase: any, params: ReportRequest) {
  const { data: teamMetrics } = await supabase
    .from('team_metrics')
    .select('*')
    .eq('sprint_id', params.sprintId || null)
    .order('captured_at', { ascending: false })
    .limit(1);

  const metric = teamMetrics?.[0];

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

async function generateIndividualReport(supabase: any, params: ReportRequest) {
  if (!params.userId) throw new Error('User ID required');

  const { data: userMetrics } = await supabase
    .from('user_metrics')
    .select('*')
    .eq('user_id', params.userId)
    .eq('sprint_id', params.sprintId || null)
    .order('captured_at', { ascending: false })
    .limit(1);

  const metric = userMetrics?.[0];

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

async function generateCustomReport(supabase: any, params: ReportRequest) {
  const startDate = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = params.endDate || new Date().toISOString();

  const { data: taskMetrics } = await supabase
    .from('task_metrics')
    .select('*')
    .gte('captured_at', startDate)
    .lte('captured_at', endDate)
    .order('captured_at', { ascending: false });

  const statusBreakdown = (taskMetrics || []).reduce((acc: any, metric: any) => {
    acc[metric.final_status] = (acc[metric.final_status] || 0) + 1;
    return acc;
  }, {});

  const avgEstimate = taskMetrics?.length
    ? taskMetrics.reduce((sum: number, m: any) => sum + (m.estimate_hours || 0), 0) / taskMetrics.length
    : 0;

  const avgActual = taskMetrics?.length
    ? taskMetrics.reduce((sum: number, m: any) => sum + (m.actual_hours || 0), 0) / taskMetrics.length
    : 0;

  return {
    type: 'custom',
    period: `${startDate} to ${endDate}`,
    summary: {
      taskCount: taskMetrics?.length || 0,
      avgEstimate: Math.round(avgEstimate * 100) / 100,
      avgActual: Math.round(avgActual * 100) / 100,
      accuracyRate: avgEstimate ? Math.round(((1 - Math.abs(avgActual - avgEstimate) / avgEstimate) * 100)) : 0,
    },
    statusBreakdown,
    metrics: taskMetrics,
    generatedAt: new Date().toISOString(),
  };
}
