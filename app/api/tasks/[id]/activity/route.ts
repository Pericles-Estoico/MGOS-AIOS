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
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const sessionWithToken = session as Session & { accessToken?: string };
    const supabase = createSupabaseServerClient(sessionWithToken.accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Fetch activity log with user details
    const { data: activity, error } = await supabase
      .from('task_activity')
      .select(
        `
        id,
        action,
        created_at,
        details,
        user:users!user_id(id, name, email)
        `
      )
      .eq('task_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return Response.json({ data: activity || [] });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
