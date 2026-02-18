import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and head can view analytics
    if (!['admin', 'head'].includes(session.user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient(session.accessToken);

    // Fetch all tasks for analysis
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, status, created_at, updated_at');

    if (tasksError) {
      throw tasksError;
    }

    // Count tasks by status
    const tasksByStatus = {
      pending: 0,
      in_progress: 0,
      submitted: 0,
      qa_review: 0,
      approved: 0,
      rejected: 0,
    };

    let totalCompletionTime = 0;
    let completedCount = 0;

    (tasks || []).forEach((task: { id: string; status: string; created_at: string; updated_at: string }) => {
      const status = task.status as keyof typeof tasksByStatus;
      if (status in tasksByStatus) {
        tasksByStatus[status] += 1;
      }

      // Calculate completion time for completed tasks
      if (status === 'approved') {
        completedCount += 1;
        const created = new Date(task.created_at).getTime();
        const updated = new Date(task.updated_at).getTime();
        const hours = (updated - created) / (1000 * 60 * 60);
        totalCompletionTime += hours;
      }
    });

    // Fetch team size
    const { count: teamSize } = await supabase
      .from('users')
      .select('id', { count: 'exact' });

    // Fetch active users (logged in today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: activeUsers } = await supabase
      .from('time_logs')
      .select('user_id', { count: 'exact' })
      .gte('logged_date', today.toISOString().split('T')[0]);

    // Calculate metrics
    const totalTasks = tasks?.length || 0;
    const completionRate = totalTasks > 0
      ? Math.round((completedCount / totalTasks) * 100)
      : 0;
    const avgCompletionTime = completedCount > 0
      ? Math.round(totalCompletionTime / completedCount)
      : 0;

    // Calculate burndown (simplified: assume sprint is 10 days, use current progress)
    const sprintProgress = completionRate;
    const expectedProgress = Math.min(100, 10 * completionRate / 10); // Linear expected

    return Response.json({
      summary: {
        total_tasks: totalTasks,
        tasks_by_status: tasksByStatus,
        team_size: teamSize || 0,
        active_users: activeUsers || 0,
        tasks_completed_today: (tasks || []).filter(
          (t: { id: string; status: string; created_at: string; updated_at: string }) =>
            t.status === 'approved' &&
            new Date(t.updated_at).toDateString() === new Date().toDateString()
        ).length,
        avg_completion_time_hours: avgCompletionTime,
        completion_rate_percent: completionRate,
        burndown: {
          current_progress: sprintProgress,
          expected_progress: expectedProgress,
          days_remaining: Math.max(0, 10 - Math.round(sprintProgress / 10)),
        },
      },
    });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
