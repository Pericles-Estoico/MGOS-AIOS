import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only QA role can submit reviews
    if (session.user.role !== 'qa') {
      return Response.json(
        { error: 'Forbidden - only QA can submit reviews' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { task_id, status, feedback } = body;

    if (!task_id || !status) {
      return Response.json(
        { error: 'Bad Request - task_id and status are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected', 'changes_requested'].includes(status)) {
      return Response.json(
        { error: 'Bad Request - invalid status' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient(session.accessToken);

    const { data, error } = await supabase
      .from('qa_reviews')
      .insert({
        task_id,
        status,
        feedback,
        reviewed_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to submit QA review' },
        { status: 500 }
      );
    }

    return Response.json(data, { status: 201 });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const taskId = url.searchParams.get('task_id');

    const supabase = createSupabaseServerClient(session.accessToken);

    let query = supabase
      .from('qa_reviews')
      .select('id, task_id, status, feedback, reviewed_by, created_at')
      .order('created_at', { ascending: false });

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to fetch QA reviews' },
        { status: 500 }
      );
    }

    return Response.json({ data: data || [] });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
