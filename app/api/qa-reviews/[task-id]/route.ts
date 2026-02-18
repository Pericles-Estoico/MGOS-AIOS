import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ 'task-id': string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 'task-id': taskId } = await params;

    const supabase = createSupabaseServerClient(session.accessToken);

    // Verify user has access to this task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, assigned_to')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check access: task executor, QA member, admin, or head
    const isExecutor = task.assigned_to === session.user?.id;
    const isQA = ['qa', 'admin', 'head'].includes(session.user?.role);

    if (!isExecutor && !isQA) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch review history
    const { data: reviews, error: reviewsError } = await supabase
      .from('qa_reviews')
      .select(
        `
        id,
        action,
        feedback,
        reviewer_id,
        created_at,
        reviewer:users!reviewer_id(name)
        `
      )
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      throw reviewsError;
    }

    // Transform data to include reviewer names
    const transformedReviews = (reviews || []).map((review: any) => ({
      id: review.id,
      action: review.action,
      feedback: review.feedback,
      reviewer_id: review.reviewer_id,
      reviewer_name: review.reviewer?.name || 'Unknown',
      created_at: review.created_at,
    }));

    return Response.json({ data: transformedReviews });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
