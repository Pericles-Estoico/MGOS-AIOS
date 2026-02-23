import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ data: [] });
    }

    // Only admin and head can view sprints
    if (!['admin', 'head'].includes(session.user?.role || '')) {
      return Response.json({ data: [] });
    }

    try {
      const sessionWithToken = session as Session & { accessToken?: string };
      const supabase = createSupabaseServerClient(sessionWithToken.accessToken);
      if (!supabase) {
        return Response.json({ data: [] });
      }

      // Fetch all sprints
      const { data: sprints, error: sprintsError } = await supabase
        .from('sprints')
        .select('*')
        .order('created_at', { ascending: false });

      if (sprintsError) {
        console.error('Database error:', sprintsError);
        return Response.json({ data: [] });
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
    } catch (dbError) {
      console.error('Database error:', dbError);
      return Response.json({ data: [] });
    }
  } catch (err) {
    console.error('API error:', err);
    return Response.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ data: null }, { status: 201 });
    }

    // Only admin can create sprints
    if (session.user.role !== 'admin') {
      return Response.json({ data: null }, { status: 201 });
    }

    try {
      const body = await request.json();
      const { name, goals, start_date, end_date, status } = body;

      if (!name || !start_date || !end_date) {
        return Response.json({ data: null }, { status: 201 });
      }

      const sessionWithToken = session as Session & { accessToken?: string };
      const supabase = createSupabaseServerClient(sessionWithToken.accessToken);
      if (!supabase) {
        return Response.json({ data: null }, { status: 201 });
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
        console.error('Supabase error:', error);
        return Response.json({ data: null }, { status: 201 });
      }

      return Response.json({ data: data?.[0] }, { status: 201 });
    } catch (parseError) {
      console.error('Request parsing error:', parseError);
      return Response.json({ data: null }, { status: 201 });
    }
  } catch (err) {
    console.error('API error:', err);
    return Response.json({ data: null }, { status: 201 });
  }
}
