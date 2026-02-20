/**
 * Email Notification Preferences API
 * Story 3.1: Email Notification System Phase 1
 *
 * GET  /api/notifications/preferences - Get user preferences
 * POST /api/notifications/preferences - Update user preferences
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface NotificationPreferences {
  task_assigned: boolean;
  status_changed: boolean;
  comment_mention: boolean;
  deadline_approaching: boolean;
  daily_digest: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
}

/**
 * GET /api/notifications/preferences
 * Get user's email notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract token (bearer token)
    const token = authHeader.replace('Bearer ', '');
    const { data: user } = await supabase.auth.getUser(token);

    if (!user?.user?.id) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get preferences from database
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Return default preferences if not found
    if (!data) {
      return NextResponse.json({
        task_assigned: true,
        status_changed: true,
        comment_mention: true,
        deadline_approaching: true,
        daily_digest: false,
        timezone: 'UTC',
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in preferences GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/preferences
 * Update user's email notification preferences
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract token (bearer token)
    const token = authHeader.replace('Bearer ', '');
    const { data: user } = await supabase.auth.getUser(token);

    if (!user?.user?.id) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const preferences: Partial<NotificationPreferences> = await request.json();

    // Validate preferences
    const validKeys = [
      'task_assigned',
      'status_changed',
      'comment_mention',
      'deadline_approaching',
      'daily_digest',
      'quiet_hours_start',
      'quiet_hours_end',
      'timezone',
    ];

    for (const key of Object.keys(preferences)) {
      if (!validKeys.includes(key)) {
        return NextResponse.json(
          { error: `Invalid preference key: ${key}` },
          { status: 400 }
        );
      }
    }

    // Validate quiet hours format if provided
    if (preferences.quiet_hours_start) {
      if (!/^\d{2}:\d{2}$/.test(preferences.quiet_hours_start)) {
        return NextResponse.json(
          { error: 'Invalid quiet_hours_start format. Use HH:MM' },
          { status: 400 }
        );
      }
    }

    if (preferences.quiet_hours_end) {
      if (!/^\d{2}:\d{2}$/.test(preferences.quiet_hours_end)) {
        return NextResponse.json(
          { error: 'Invalid quiet_hours_end format. Use HH:MM' },
          { status: 400 }
        );
      }
    }

    // Update or create preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: user.user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in preferences POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/notifications/preferences
 * CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
