import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const userRole = (session.user as unknown as Record<string, unknown>)?.role || 'executor';
    const userId = session.user?.id;

    // Build query with JOINs for user and task information
    let query = supabase
      .from('time_logs')
      .select(
        `id,
         duration_minutes,
         logged_at,
         notes,
         task_id,
         user_id,
         tasks!inner(id, title),
         users!inner(id, name, email)`,
        { count: 'exact' }
      )
      .order('logged_at', { ascending: false });

    // Restrict data based on role
    if (userRole === 'executor') {
      query = query.eq('user_id', userId);
    }
    // admin and head see all logs

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch time logs' },
        { status: 500 }
      );
    }

    // Format response
    const formattedData = (data || []).map((log: Record<string, unknown>) => ({
      id: log.id,
      userName: (((log.users as unknown[] | undefined)?.[0] as Record<string, unknown> | undefined)?.name || 'Unknown') as string,
      userEmail: (((log.users as unknown[] | undefined)?.[0] as Record<string, unknown> | undefined)?.email || '') as string,
      taskId: log.task_id,
      taskTitle: (((log.tasks as unknown[] | undefined)?.[0] as Record<string, unknown> | undefined)?.title || 'Unknown Task') as string,
      durationMinutes: log.duration_minutes as number,
      hours: ((log.duration_minutes as number) / 60).toFixed(1),
      notes: log.notes,
      loggedAt: log.logged_at,
    }));

    return NextResponse.json({
      data: formattedData,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, duration_minutes, notes } = body;

    if (!task_id || !duration_minutes) {
      return NextResponse.json(
        { error: 'task_id e duration_minutes são obrigatórios' },
        { status: 400 }
      );
    }

    if (duration_minutes < 1 || duration_minutes > 1440) {
      return NextResponse.json(
        { error: 'duration_minutes deve estar entre 1 e 1440' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('time_logs')
      .insert({
        task_id,
        user_id: session.user?.id,
        duration_minutes,
        notes: notes || null,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Falha ao registrar tempo' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
