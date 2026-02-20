import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const supabase = createSupabaseServerClient(session.accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Fetch comments with user details
    const { data: comments, error } = await supabase
      .from('task_comments')
      .select(
        `
        id,
        content,
        is_edited,
        created_at,
        updated_at,
        user:users!user_id(id, name, email)
        `
      )
      .eq('task_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return Response.json({ data: comments || [] });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return Response.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient(session.accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: id,
        user_id: session.user.id,
        content: content.trim(),
      })
      .select(
        `
        id,
        content,
        is_edited,
        created_at,
        user:users!user_id(id, name, email)
        `
      )
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('task_activity').insert({
      task_id: id,
      user_id: session.user.id,
      action: 'commented',
      details: { comment_id: comment.id },
    });

    return Response.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
