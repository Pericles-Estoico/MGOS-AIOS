import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

interface SessionWithAccessToken {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
  accessToken?: string;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || session.user?.id;

    // Users can only view their own preferences
    if (userId !== session.user?.id && session.user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient((session as SessionWithAccessToken).accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Fetch user preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine (return defaults)
      throw error;
    }

    // Return data or defaults
    const preferences = data || {
      user_id: userId,
      email_task_assigned: true,
      email_qa_feedback: true,
      email_burndown_warning: true,
    };

    return Response.json({ data: preferences });
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

    const body = await request.json();
    const {
      email_task_assigned,
      email_qa_feedback,
      email_burndown_warning,
    } = body;

    const supabase = createSupabaseServerClient((session as SessionWithAccessToken).accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Upsert preferences for current user
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: session.user?.id,
          email_task_assigned:
            email_task_assigned !== undefined ? email_task_assigned : true,
          email_qa_feedback:
            email_qa_feedback !== undefined ? email_qa_feedback : true,
          email_burndown_warning:
            email_burndown_warning !== undefined ? email_burndown_warning : true,
        },
        { onConflict: 'user_id' }
      )
      .select();

    if (error) {
      throw error;
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'UPDATE_PREFERENCES',
      table_name: 'notification_preferences',
      record_id: session.user?.id,
      user_id: session.user?.id,
      changes: {
        email_task_assigned,
        email_qa_feedback,
        email_burndown_warning,
      },
    });

    return Response.json({ data: data?.[0] });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
