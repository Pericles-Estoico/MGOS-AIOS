/**
 * Notification triggers - Called when events happen in the system
 * These trigger email notifications based on user preferences
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
      console.warn('⚠️  Supabase not configured for notifications');
      return undefined;
    }
    return (client as SupabaseClient)[prop as keyof SupabaseClient];
  },
});

/**
 * Send task assignment notification
 */
export async function notifyTaskAssigned(
  taskId: string,
  taskTitle: string,
  assignedToUserId: string
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.NOTIFICATIONS_API_KEY || '',
      },
      body: JSON.stringify({
        type: 'task_assigned',
        userId: assignedToUserId,
        taskId,
        taskTitle,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send task assignment notification:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending task assignment notification:', error);
    return false;
  }
}

/**
 * Send QA review feedback notification
 */
export async function notifyQAReview(
  taskId: string,
  taskTitle: string,
  executorUserId: string,
  status: 'approved' | 'rejected',
  feedback?: string
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.NOTIFICATIONS_API_KEY || '',
      },
      body: JSON.stringify({
        type: 'qa_feedback',
        userId: executorUserId,
        taskId,
        taskTitle,
        status,
        feedback,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send QA review notification:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending QA review notification:', error);
    return false;
  }
}

/**
 * Send burndown warning notification (when team is behind)
 */
export async function notifyBurndownWarning(
  teamHeadUserId: string,
  currentProgress: number,
  expectedProgress: number,
  daysRemaining: number
) {
  try {
    // This would be a direct email send, not through the notification API
    // since it's not tied to a specific task
    // TODO: Implement direct SMTP send for burndown warnings
    console.log('Burndown warning would be sent to team head:', teamHeadUserId, {
      currentProgress: currentProgress.toFixed(1),
      expectedProgress: expectedProgress.toFixed(1),
      daysRemaining,
    });
    return true;
  } catch (error) {
    console.error('Error sending burndown warning:', error);
    return false;
  }
}

/**
 * Get user email from user ID
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data.user?.email) {
      console.error('User not found:', error);
      return null;
    }

    return data.user.email;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
}

/**
 * Check if user has notifications enabled
 */
export async function areNotificationsEnabled(
  userId: string,
  type: 'email_task_assigned' | 'email_qa_feedback' | 'email_burndown_warning'
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select(type)
      .eq('user_id', userId)
      .single();

    if (error) {
      // If preferences don't exist, default to true (enabled)
      if (error.code === 'PGRST116') {
        return true;
      }
      console.error('Error checking notification preferences:', error);
      return false;
    }

    return (data?.[type as keyof typeof data] as boolean) ?? true;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Create notification preferences for new user
 */
export async function createUserNotificationPreferences(userId: string) {
  try {
    await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        email_task_assigned: true,
        email_qa_feedback: true,
        email_burndown_warning: true,
      });

    return true;
  } catch (error) {
    console.error('Error creating notification preferences:', error);
    return false;
  }
}

/**
 * Send QA review action notification (approve, reject, request changes)
 */
export async function notifyQAReviewAction(
  taskId: string,
  action: 'approved' | 'rejected' | 'requested_changes',
  feedback: string | null | undefined,
  executorUserId: string
) {
  try {
    // Map action to readable text
    const actionMap = {
      approved: 'approved',
      rejected: 'rejected',
      requested_changes: 'needs changes',
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.NOTIFICATIONS_API_KEY || '',
      },
      body: JSON.stringify({
        type: 'qa_review_action',
        userId: executorUserId,
        taskId,
        action: actionMap[action],
        feedback,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send QA review action notification:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending QA review action notification:', error);
    return false;
  }
}
