import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    // 2. Parse pagination parameters
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100); // Max 100

    // 3. Create Supabase client with user's JWT (RLS will apply automatically)
    const supabase = createSupabaseServerClient(session.accessToken);

    // 4. Query tasks (RLS policies filter by role)
    const { data, error, count } = await supabase
      .from('tasks')
      .select('id, title, description, status, priority, due_date, assigned_to, created_by, created_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    // 5. Return paginated results
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
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check authorization (only admin/head can create)
    if (!session.user.role || !['admin', 'head'].includes(session.user.role)) {
      return Response.json(
        { error: 'Forbidden - only admin/head can create tasks' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { title, description, priority, due_date, assigned_to } = body;

    // 4. Validate required fields
    if (!title || !priority) {
      return Response.json(
        { error: 'Bad Request - title and priority are required' },
        { status: 400 }
      );
    }

    // 5. Create Supabase client and insert task
    const supabase = createSupabaseServerClient(session.accessToken);

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        priority,
        due_date,
        assigned_to,
        created_by: session.user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to create task' },
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
