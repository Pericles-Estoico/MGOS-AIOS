import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { createSupabaseServerClient } from '@/lib/supabase';

type ReassignmentEntry = Record<string, unknown>;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionWithToken = session as Session & { accessToken?: string };
    const supabase = createSupabaseServerClient(sessionWithToken.accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }
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
      !['admin', 'head'].includes(session.user?.role || '')
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
    const transformedHistory = (history || []).map((entry) => {
      const e = entry as Record<string, unknown>;
      return {
        id: e.id,
        old_assignee_id: e.old_assignee_id,
        new_assignee_id: e.new_assignee_id,
        old_assignee_name: ((e.old_assignee as Record<string, unknown> | undefined)?.[0] as Record<string, unknown> | undefined)?.name || 'Unknown',
        new_assignee_name: ((e.new_assignee as Record<string, unknown> | undefined)?.[0] as Record<string, unknown> | undefined)?.name || 'Unknown',
        reason: e.reason,
        reassigned_by: e.reassigned_by,
        reassigned_by_name: ((e.performer as Record<string, unknown> | undefined)?.[0] as Record<string, unknown> | undefined)?.name || 'Unknown',
        created_at: e.created_at,
      };
    });

    return Response.json({ data: transformedHistory });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
