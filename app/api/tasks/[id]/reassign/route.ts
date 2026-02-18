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

    // Only admin and head can reassign
    if (!['admin', 'head'].includes(session.user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { assigned_to } = await request.json();

    if (!assigned_to) {
      return Response.json(
        { error: 'assigned_to is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient(session.accessToken);

    // Get current task
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update task with new assignee
    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update({
        assigned_to,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return Response.json(
        { error: 'Failed to reassign task' },
        { status: 500 }
      );
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      table_name: 'tasks',
      record_id: id,
      operation: 'reassign_task',
      old_value: { assigned_to: task.assigned_to },
      new_value: { assigned_to },
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
