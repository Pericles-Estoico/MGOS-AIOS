import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, status, is_typing } = body;

    if (!task_id) {
      return Response.json(
        { error: 'task_id is required' },
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

    // Update or insert user presence
    const { data, error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: session.user.id,
        task_id,
        status: status || 'online',
        is_typing: is_typing ?? false,
        typing_at: is_typing ? new Date().toISOString() : null,
        last_activity: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    console.error('Error updating presence:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
