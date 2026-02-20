import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createSupabaseServerClient(session.accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('tasks')
      .select(
        `
        id,
        title,
        description,
        status,
        priority,
        due_date,
        assigned_to,
        created_by,
        created_at,
        updated_at,
        evidence(id, file_url, description, created_at, created_by),
        qa_reviews(id, status, feedback, created_by, created_at)
        `
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    return Response.json(data);
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, priority, due_date, assigned_to } = body;

    const supabase = createSupabaseServerClient(session.accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        status,
        priority,
        due_date,
        assigned_to,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return Response.json(data);
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization (only admin can delete)
    if (session.user.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden - only admin can delete tasks' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = createSupabaseServerClient(session.accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Soft delete
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      );
    }

    return Response.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
