import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient(session.accessToken);
    const taskId = params.id;

    // Fetch task to verify user has access
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, assigned_to')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check access: user is assigned, admin, or head
    if (
      task.assigned_to !== session.user?.id &&
      !['admin', 'head'].includes(session.user?.role)
    ) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch reassignment history
    const { data: history, error: historyError } = await supabase
      .from('reassignment_history')
      .select(
        `
        id,
        old_assignee_id,
        new_assignee_id,
        reason,
        reassigned_by,
        created_at,
        old_assignee:users!old_assignee_id(name),
        new_assignee:users!new_assignee_id(name),
        performer:users!reassigned_by(name)
      `
      )
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (historyError) {
      throw historyError;
    }

    // Transform data to include names
    const transformedHistory = (history || []).map((entry: any) => ({
      id: entry.id,
      old_assignee_id: entry.old_assignee_id,
      new_assignee_id: entry.new_assignee_id,
      old_assignee_name: entry.old_assignee?.name || 'Unknown',
      new_assignee_name: entry.new_assignee?.name || 'Unknown',
      reason: entry.reason,
      reassigned_by: entry.reassigned_by,
      reassigned_by_name: entry.performer?.name || 'Unknown',
      created_at: entry.created_at,
    }));

    return Response.json({ data: transformedHistory });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
