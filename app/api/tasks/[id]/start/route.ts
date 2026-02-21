import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    // 2. Get task ID from params
    const { id: taskId } = await params;

    // 3. Create Supabase client
    const supabase = createSupabaseServerClient((session as any).accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // 4. Get current task to validate status and assignment
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('id, status, assigned_to, title')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return Response.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // 5. Validate task is assigned to current user
    if (task.assigned_to !== session.user.id) {
      return Response.json(
        { error: 'Forbidden - task not assigned to you' },
        { status: 403 }
      );
    }

    // 6. Validate task is in pending status
    if (task.status !== 'pending') {
      return Response.json(
        { error: `Task is already ${task.status}, cannot start again` },
        { status: 400 }
      );
    }

    // 7. Update task status to in_progress
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return Response.json(
        { error: 'Failed to start task' },
        { status: 500 }
      );
    }

    // 8. Create audit log entry
    await supabase.from('audit_logs').insert({
      table_name: 'tasks',
      record_id: taskId,
      operation: 'start_task',
      old_value: { status: 'pending' },
      new_value: { status: 'in_progress' },
      created_by: session.user.id,
      created_at: new Date().toISOString(),
    });

    // 9. Return updated task
    return Response.json(updatedTask, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
