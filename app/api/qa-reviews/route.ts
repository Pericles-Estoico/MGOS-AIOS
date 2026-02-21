import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { createSupabaseServerClient } from '@/lib/supabase';
import { notifyQAReviewAction } from '@/lib/notification-triggers';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only QA role can access
    if (!['qa', 'admin', 'head'].includes(session.user?.role || '')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const offset = (page - 1) * limit;
    const priorityFilter = searchParams.get('priority');
    const executorFilter = searchParams.get('executor');
    const search = searchParams.get('search');

    const supabase = createSupabaseServerClient((session as any).accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Build query for submitted tasks
    let query = supabase
      .from('tasks')
      .select(
        `
        id,
        title,
        description,
        assigned_to,
        priority,
        created_at,
        submitted_at,
        users:assigned_to(name, email)
        `,
        { count: 'exact' }
      )
      .eq('status', 'submitted');

    if (priorityFilter && priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter);
    }

    if (executorFilter) {
      query = query.eq('assigned_to', executorFilter);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: tasks, error: tasksError, count } = await query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tasksError) {
      throw tasksError;
    }

    return Response.json({
      data: tasks,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit),
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
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only QA role can create reviews
    if (!['qa', 'admin', 'head'].includes(session.user?.role || '')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { task_id, action, feedback } = body;

    if (!task_id || !action) {
      return Response.json(
        { error: 'task_id and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['approved', 'rejected', 'requested_changes'];
    if (!validActions.includes(action)) {
      return Response.json(
        { error: 'Invalid action' },
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

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', task_id)
      .single();

    if (taskError || !task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Create review entry
    const { data: review, error: reviewError } = await supabase
      .from('qa_reviews')
      .insert({
        task_id,
        reviewer_id: session.user.id,
        action,
        feedback: feedback || null,
      })
      .select()
      .single();

    if (reviewError) {
      throw reviewError;
    }

    // Update task status based on action
    let newStatus = task.status;
    if (action === 'approved') {
      newStatus = 'approved';
    } else if (action === 'rejected') {
      newStatus = 'rejected';
    } else if (action === 'requested_changes') {
      newStatus = 'in_progress';
    }

    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task_id);

    if (updateError) {
      throw updateError;
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      table_name: 'tasks',
      record_id: task_id,
      action: `qa_${action}`,
      changes: {
        status: {
          old: task.status,
          new: newStatus,
        },
        feedback,
      },
      user_id: session.user.id,
    });

    // Send notification email
    await notifyQAReviewAction(task_id, action, feedback, task.assigned_to);

    return Response.json(review, { status: 201 });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
