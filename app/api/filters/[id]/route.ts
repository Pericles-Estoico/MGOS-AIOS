import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { createSupabaseServerClient } from '@/lib/supabase';

interface SessionWithAccessToken {
  user?: {
    id?: string;
    email?: string;
    name?: string;
  };
  accessToken?: string;
}

export async function PUT(
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
    const { name, description, filters, is_shared, is_default } = body;

    const supabase = createSupabaseServerClient((session as SessionWithAccessToken).accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Verify ownership
    const { data: filter, error: fetchError } = await supabase
      .from('saved_filters')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !filter || filter.user_id !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('saved_filters')
        .update({ is_default: false })
        .eq('user_id', session.user.id)
        .neq('id', id);
    }

    const { data, error } = await supabase
      .from('saved_filters')
      .update({
        name,
        description,
        filters,
        is_shared,
        is_default,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error updating filter:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const supabase = createSupabaseServerClient((session as SessionWithAccessToken).accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Verify ownership
    const { data: filter, error: fetchError } = await supabase
      .from('saved_filters')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !filter || filter.user_id !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('saved_filters')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting filter:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
