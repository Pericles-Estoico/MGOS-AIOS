import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { notifyTaskAssigned } from '@/lib/notification-triggers';

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
    if (!['admin', 'head'].includes(session.user?.role || '')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const new_assignee_id = body.new_assignee_id || body.assigned_to;
    const reason = body.reason || null;

    if (!new_assignee_id) {
      return Response.json(
        { error: 'new_assignee_id is required' },
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

    // Validation: cannot reassign completed tasks
    if (task.status === 'approved') {
      return Response.json(
        { error: 'Cannot reassign completed task' },
        { status: 400 }
      );
    }

    // Validation: cannot reassign to self
    if (new_assignee_id === task.assigned_to) {
      return Response.json(
        { error: 'Select a different user' },
        { status: 400 }
      );
    }

    // Store old assignee for history
    const old_assignee_id = task.assigned_to;

    // Update task with new assignee
    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update({
        assigned_to: new_assignee_id,
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

    // Create reassignment history entry
    await supabase.from('reassignment_history').insert({
      task_id: id,
      old_assignee_id,
      new_assignee_id,
      reason,
      reassigned_by: session.user.id,
    });

    // Create audit log
    await supabase.from('audit_logs').insert({
      table_name: 'tasks',
      record_id: id,
      action: 'reassign_task',
      changes: {
        assigned_to: {
          old: old_assignee_id,
          new: new_assignee_id,
        },
        reason,
      },
      user_id: session.user.id,
    });

    // Send notification to newly assigned user
    await notifyTaskAssigned(id, task.title, new_assignee_id);

    return Response.json(updated, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
