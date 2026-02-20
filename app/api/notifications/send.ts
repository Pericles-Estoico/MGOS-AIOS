import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendEmail, taskAssignmentEmail, qaReviewFeedbackEmail } from '@/lib/email';

let _supabase: SupabaseClient | null;

function getSupabaseClient(): SupabaseClient | null {
  if (_supabase !== undefined) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    _supabase = null;
    return null;
  }

  _supabase = createClient(url, key);
  return _supabase;
}

const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('⚠️  Supabase not configured for send endpoint');
      return undefined;
    }
    return (client as unknown as Record<string, unknown>)[prop as string];
  },
});

export async function POST(request: NextRequest) {
  try {
    const { type, userId, taskId, taskTitle, status, feedback } = await request.json();

    if (!type || !userId || !taskId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user?.email) {
      console.error('User not found:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userEmail = userData.user.email;
    const userName = userData.user.user_metadata?.name || userEmail.split('@')[0];

    // Get notification preferences
    const { data: prefs, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError && prefsError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefsError);
    }

    // Check if user has disabled notifications
    if (prefs) {
      if (type === 'task_assigned' && !prefs.email_task_assigned) {
        return NextResponse.json({ message: 'User disabled task notifications' });
      }
      if (type === 'qa_feedback' && !prefs.email_qa_feedback) {
        return NextResponse.json({ message: 'User disabled QA notifications' });
      }
    }

    // Generate unsubscribe link (would be real in production)
    const unsubscribeLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/notifications`;

    let emailOptions;

    switch (type) {
      case 'task_assigned':
        emailOptions = taskAssignmentEmail(userName, taskTitle, taskId, unsubscribeLink);
        break;
      case 'qa_feedback':
        if (!status) {
          return NextResponse.json(
            { error: 'Missing status for QA feedback' },
            { status: 400 }
          );
        }
        emailOptions = qaReviewFeedbackEmail(
          userName,
          taskTitle,
          status,
          feedback || '',
          taskId,
          unsubscribeLink
        );
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown notification type' },
          { status: 400 }
        );
    }

    emailOptions.to = userEmail;

    // Send email
    const sent = await sendEmail(emailOptions);

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Log notification sent to audit table
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        operation: `email_${type}_sent`,
        table_name: 'notifications',
        record_id: taskId,
        changes: { type, recipient: userEmail },
        timestamp: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      recipient: userEmail,
    });
  } catch (error) {
    console.error('Notification endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
