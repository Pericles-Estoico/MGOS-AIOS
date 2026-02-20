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

    // Get all users with active presence on this task
    const { data: presence, error } = await supabase
      .from('user_presence')
      .select(
        `
        user_id,
        status,
        is_typing,
        users!user_id(id, name, email)
        `
      )
      .eq('task_id', id)
      .eq('status', 'online')
      .order('last_activity', { ascending: false });

    if (error) throw error;

    // Transform response to flatten user data
    interface PresenceData {
      user_id: string;
      status: string;
      is_typing: boolean;
      users?: { name: string; email: string };
    }
    const formattedData = presence?.map((p: PresenceData) => ({
      user_id: p.user_id,
      name: p.users?.name || 'Unknown',
      email: p.users?.email || 'unknown@example.com',
      status: p.status,
      is_typing: p.is_typing,
    })) || [];

    return Response.json({ data: formattedData });
  } catch (error) {
    console.error('Error fetching presence:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
