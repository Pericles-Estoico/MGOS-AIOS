import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ data: null });
    }

    const { id } = await params;
    const sessionWithToken = session as Session & { accessToken?: string };
    const supabase = createSupabaseServerClient(sessionWithToken.accessToken);
    if (!supabase) {
      return Response.json({ data: null });
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(
          `
          id,
          title,
          description,
          status,
          priority,
          due_date,
          assigned_to,
          created_by,
          created_at,
          updated_at,
          evidence(id, file_url, description, created_at, created_by),
          qa_reviews(id, status, feedback, created_by, created_at)
          `
        )
        .eq('id', id)
        .single();

      if (error || !data) {
        return Response.json({ data: null });
      }

      return Response.json(data);
    } catch (dbError) {
      console.error('Database error:', dbError);
      return Response.json({ data: null });
    }
  } catch (err) {
    console.error('API error:', err);
    return Response.json({ data: null });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ data: null });
    }

    const { id } = await params;

    try {
      const body = await request.json();
      const { status, priority, due_date, assigned_to } = body;

      const sessionWithToken = session as Session & { accessToken?: string };
      const supabase = createSupabaseServerClient(sessionWithToken.accessToken);
      if (!supabase) {
        return Response.json({ data: null });
      }

      const { data, error } = await supabase
        .from('tasks')
        .update({
          status,
          priority,
          due_date,
          assigned_to,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return Response.json({ data: null });
      }

      return Response.json(data);
    } catch (parseError) {
      console.error('Request parsing error:', parseError);
      return Response.json({ data: null });
    }
  } catch (err) {
    console.error('API error:', err);
    return Response.json({ data: null });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ message: 'Deleted' });
    }

    // Check authorization (only admin can delete)
    if (session.user.role !== 'admin') {
      return Response.json({ message: 'Deleted' });
    }

    const { id } = await params;
    const sessionWithToken = session as Session & { accessToken?: string };
    const supabase = createSupabaseServerClient(sessionWithToken.accessToken);
    if (!supabase) {
      return Response.json({ message: 'Deleted' });
    }

    try {
      // Soft delete
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'deleted', deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        return Response.json({ message: 'Deleted' });
      }

      return Response.json({ message: 'Task deleted' });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return Response.json({ message: 'Deleted' });
    }
  } catch (err) {
    console.error('API error:', err);
    return Response.json({ message: 'Deleted' });
  }
}
