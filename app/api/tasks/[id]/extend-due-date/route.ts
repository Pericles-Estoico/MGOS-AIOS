import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and head can extend due dates
    if (!['admin', 'head'].includes(session.user?.role || '')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { due_date } = await request.json();

    if (!due_date) {
      return Response.json(
        { error: 'due_date is required' },
        { status: 400 }
      );
    }

    // Validate due_date is in future
    const newDate = new Date(due_date);
    if (newDate <= new Date()) {
      return Response.json(
        { error: 'Due date must be in the future' },
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

    // Get current task
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update task with new due date
    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update({
        due_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return Response.json(
        { error: 'Failed to extend due date' },
        { status: 500 }
      );
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      table_name: 'tasks',
      record_id: id,
      operation: 'extend_due_date',
      old_value: { due_date: task.due_date },
      new_value: { due_date },
      created_by: session.user.id,
    });

    return Response.json(updated, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
