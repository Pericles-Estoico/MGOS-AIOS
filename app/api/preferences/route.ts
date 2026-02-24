import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';

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
      return Response.json({
        data: {
          user_id: '',
          email_task_assigned: true,
          email_qa_feedback: true,
          email_burndown_warning: true,
        },
      });
    }

    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('user_id') || session.user?.id;

      // Users can only view their own preferences
      if (userId !== session.user?.id && session.user?.role !== 'admin') {
        return Response.json({
          data: {
            user_id: userId || '',
            email_task_assigned: true,
            email_qa_feedback: true,
            email_burndown_warning: true,
          },
        });
      }

      const supabase = createSupabaseServerClient((session as SessionWithAccessToken).accessToken);
      if (!supabase) {
        return Response.json({
          data: {
            user_id: userId || '',
            email_task_assigned: true,
            email_qa_feedback: true,
            email_burndown_warning: true,
          },
        });
      }

      // Fetch user preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine (return defaults)
        console.error('Database error:', error);
        return Response.json({
          data: {
            user_id: userId || '',
            email_task_assigned: true,
            email_qa_feedback: true,
            email_burndown_warning: true,
          },
        });
      }

      // Return data or defaults
      const preferences = data || {
        user_id: userId,
        email_task_assigned: true,
        email_qa_feedback: true,
        email_burndown_warning: true,
      };

      return Response.json({ data: preferences });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return Response.json({
        data: {
          user_id: session.user?.id || '',
          email_task_assigned: true,
          email_qa_feedback: true,
          email_burndown_warning: true,
        },
      });
    }
  } catch (err) {
    console.error('API error:', err);
    return Response.json({
      data: {
        user_id: '',
        email_task_assigned: true,
        email_qa_feedback: true,
        email_burndown_warning: true,
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({
        data: {
          user_id: '',
          email_task_assigned: true,
          email_qa_feedback: true,
          email_burndown_warning: true,
        },
      });
    }

    try {
      const body = await request.json();
      const {
        email_task_assigned,
        email_qa_feedback,
        email_burndown_warning,
      } = body;

      const supabase = createSupabaseServerClient((session as SessionWithAccessToken).accessToken);
      if (!supabase) {
        return Response.json({
          data: {
            user_id: session.user?.id || '',
            email_task_assigned:
              email_task_assigned !== undefined ? email_task_assigned : true,
            email_qa_feedback:
              email_qa_feedback !== undefined ? email_qa_feedback : true,
            email_burndown_warning:
              email_burndown_warning !== undefined ? email_burndown_warning : true,
          },
        });
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
        console.error('Database error:', error);
        return Response.json({
          data: {
            user_id: session.user?.id || '',
            email_task_assigned:
              email_task_assigned !== undefined ? email_task_assigned : true,
            email_qa_feedback:
              email_qa_feedback !== undefined ? email_qa_feedback : true,
            email_burndown_warning:
              email_burndown_warning !== undefined ? email_burndown_warning : true,
          },
        });
      }

      // Audit log with correct column names
      await supabase.from('audit_logs').insert({
        entity_type: 'notification_preferences',
        entity_id: session.user?.id,
        action: 'UPDATE_PREFERENCES',
        changed_by: session.user?.id,
        new_values: {
          email_task_assigned,
          email_qa_feedback,
          email_burndown_warning,
        },
      });

      return Response.json({ data: data?.[0] });
    } catch (parseError) {
      console.error('Request parsing error:', parseError);
      return Response.json({
        data: {
          user_id: session.user?.id || '',
          email_task_assigned: true,
          email_qa_feedback: true,
          email_burndown_warning: true,
        },
      });
    }
  } catch (err) {
    console.error('API error:', err);
    return Response.json({
      data: {
        user_id: '',
        email_task_assigned: true,
        email_qa_feedback: true,
        email_burndown_warning: true,
      },
    });
  }
}
