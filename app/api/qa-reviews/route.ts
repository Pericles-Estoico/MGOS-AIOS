import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { notifyQAReviewAction } from '@/lib/notification-triggers';
import type { Session } from 'next-auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      });
    }

    // Only QA role can access
    if (!['qa', 'admin', 'head'].includes(session.user?.role || '')) {
      return Response.json({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      });
    }

    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = 10;
      const offset = (page - 1) * limit;
      const priorityFilter = searchParams.get('priority');
      const executorFilter = searchParams.get('executor');
      const search = searchParams.get('search');

      const sessionWithToken = session as Session & { accessToken?: string };
      const supabase = createSupabaseServerClient(sessionWithToken.accessToken);
      if (!supabase) {
        return Response.json({
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }

      // Build query for tasks awaiting QA review (status: 'enviado_qa')
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
          updated_at,
          users:assigned_to(name, email)
          `,
          { count: 'exact' }
        )
        .eq('status', 'enviado_qa');

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
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (tasksError) {
        console.error('Database error:', tasksError);
        return Response.json({
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
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
    } catch (dbError) {
      console.error('Database error:', dbError);
      return Response.json({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      });
    }
  } catch (err) {
    console.error('API error:', err);
    return Response.json({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ data: null }, { status: 201 });
    }

    // Only QA role can create reviews
    if (!['qa', 'admin', 'head'].includes(session.user?.role || '')) {
      return Response.json({ data: null }, { status: 201 });
    }

    try {
      const body = await request.json();
      const { task_id, action, feedback } = body;

      if (!task_id || !action) {
        return Response.json({ data: null }, { status: 201 });
      }

      const validActions = ['approved', 'rejected', 'requested_changes'];
      if (!validActions.includes(action)) {
        return Response.json({ data: null }, { status: 201 });
      }

      const sessionWithToken = session as Session & { accessToken?: string };
      const supabase = createSupabaseServerClient(sessionWithToken.accessToken);
      if (!supabase) {
        return Response.json({ data: null }, { status: 201 });
      }

      // Get task details
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', task_id)
        .single();

      if (taskError || !task) {
        return Response.json({ data: null }, { status: 201 });
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
        console.error('Supabase error:', reviewError);
        return Response.json({ data: null }, { status: 201 });
      }

      // Update task status based on QA action
      // Schema statuses: 'a_fazer' | 'fazendo' | 'enviado_qa' | 'aprovado' | 'concluido'
      let newStatus = task.status;
      if (action === 'approved') {
        newStatus = 'aprovado';
      } else if (action === 'rejected') {
        // Send back to 'fazendo' so executor can fix and resubmit
        newStatus = 'fazendo';
      } else if (action === 'requested_changes') {
        newStatus = 'fazendo';
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task_id);

      if (updateError) {
        console.error('Supabase error:', updateError);
        return Response.json({ data: null }, { status: 201 });
      }

      // Create audit log with correct column names
      await supabase.from('audit_logs').insert({
        entity_type: 'tasks',
        entity_id: task_id,
        action: `QA_${action.toUpperCase()}`,
        changed_by: session.user.id,
        old_values: { status: task.status },
        new_values: { status: newStatus, feedback },
      });

      // Send notification email
      await notifyQAReviewAction(task_id, action, feedback, task.assigned_to);

      return Response.json(review, { status: 201 });
    } catch (parseError) {
      console.error('Request parsing error:', parseError);
      return Response.json({ data: null }, { status: 201 });
    }
  } catch (err) {
    console.error('API error:', err);
    return Response.json({ data: null }, { status: 201 });
  }
}
