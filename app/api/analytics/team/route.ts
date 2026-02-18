import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
}

interface Task {
  id: string;
  assigned_to: string;
  status: string;
  created_at: string;
  updated_at: string;
}

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

    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name');

    if (usersError) {
      throw usersError;
    }

    // Fetch all tasks with executor info
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, assigned_to, status, created_at, updated_at');

    if (tasksError) {
      throw tasksError;
    }

    // Calculate per-user stats
    const teamStats = (users || []).map((user: User) => {
      const userTasks = (tasks || []).filter(
        (t: Task) => t.assigned_to === user.id
      );

      const tasksCompleted = userTasks.filter(
        (t: Task) => t.status === 'approved'
      ).length;

      const tasksInProgress = userTasks.filter(
        (t: Task) => t.status === 'in_progress'
      ).length;

      const completionRate = userTasks.length > 0
        ? Math.round((tasksCompleted / userTasks.length) * 100)
        : 0;

      // Calculate average time per task
      let totalTime = 0;
      let completedCount = 0;

      userTasks.forEach((task: Task) => {
        if (task.status === 'approved') {
          completedCount += 1;
          const created = new Date(task.created_at).getTime();
          const updated = new Date(task.updated_at).getTime();
          const hours = (updated - created) / (1000 * 60 * 60);
          totalTime += hours;
        }
      });

      const avgTimePerTask = completedCount > 0
        ? Math.round(totalTime / completedCount * 10) / 10
        : 0;

      return {
        user_id: user.id,
        name: user.name,
        tasks_assigned: userTasks.length,
        tasks_completed: tasksCompleted,
        tasks_in_progress: tasksInProgress,
        completion_rate: completionRate,
        avg_time_per_task_hours: avgTimePerTask,
        trend_7days: [0, 0, 0, 0, 0, 0, 0], // Placeholder for 7-day trend
      };
    });

    // Sort by completion rate (descending)
    teamStats.sort(
      (
        a: { completion_rate: number },
        b: { completion_rate: number }
      ) => b.completion_rate - a.completion_rate
    );

    return Response.json({ data: teamStats });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
