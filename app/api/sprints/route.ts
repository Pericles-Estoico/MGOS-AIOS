import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and head can view sprints
    if (!['admin', 'head'].includes(session.user?.role || '')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient((session as any).accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Fetch all sprints
    const { data: sprints, error: sprintsError } = await supabase
      .from('sprints')
      .select('*')
      .order('created_at', { ascending: false });

    if (sprintsError) {
      throw sprintsError;
    }

    // Get task counts for each sprint
    const sprintsWithStats = await Promise.all(
      (sprints || []).map(async (sprint) => {
        const { count: taskCount, data: tasks } = await supabase
          .from('tasks')
          .select('id, status', { count: 'exact' })
          .eq('sprint_id', sprint.id);

        const completedCount = (tasks || []).filter(
          (t) => t.status === 'approved'
        ).length;

        return {
          ...sprint,
          task_count: taskCount || 0,
          completed_count: completedCount,
        };
      })
    );

    return Response.json({ data: sprintsWithStats });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can create sprints
    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, goals, start_date, end_date, status } = body;

    if (!name || !start_date || !end_date) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient((session as any).accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Create sprint
    const { data, error } = await supabase
      .from('sprints')
      .insert({
        name,
        goals: goals || null,
        start_date,
        end_date,
        status: status || 'planning',
        created_by: session.user.id,
      })
      .select();

    if (error) {
      throw error;
    }

    return Response.json({ data: data?.[0] }, { status: 201 });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
