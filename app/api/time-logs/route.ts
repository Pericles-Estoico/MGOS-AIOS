import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);

    const supabase = createSupabaseServerClient((session as any).accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const { data, error, count } = await supabase
      .from('time_logs')
      .select(
        'id, task_id, user_id, duration_minutes, description, logged_date, created_at',
        { count: 'exact' }
      )
      .order('logged_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to fetch time logs' },
        { status: 500 }
      );
    }

    return Response.json({
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, duration_minutes, description, logged_date } = body;

    if (!task_id || !duration_minutes) {
      return Response.json(
        { error: 'Bad Request - task_id and duration_minutes are required' },
        { status: 400 }
      );
    }

    if (duration_minutes < 0 || duration_minutes > 1440) {
      return Response.json(
        { error: 'Bad Request - duration must be between 0 and 1440 minutes' },
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

    const { data, error } = await supabase
      .from('time_logs')
      .insert({
        task_id,
        user_id: session.user.id,
        duration_minutes,
        description,
        logged_date: logged_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to log time' },
        { status: 500 }
      );
    }

    return Response.json(data, { status: 201 });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
