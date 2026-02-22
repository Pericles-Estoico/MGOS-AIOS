/**
 * GET /api/user/preferences
 * POST /api/user/preferences
 * User notification preferences management
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const TIMEZONES = [
  'America/Anchorage',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/New_York',
  'America/Sao_Paulo',
  'America/Toronto',
  'Atlantic/Azores',
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Rome',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const userId = session.user?.id;

    // Get or create notification preferences
    const { data: prefs, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // If no preferences exist, create defaults
    if (!prefs) {
      const { data: newPrefs, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          email_task_assigned: true,
          email_qa_feedback: true,
          email_burndown_warning: true,
          email_status_changed: true,
          email_comment_mention: true,
          email_deadline_approaching: true,
          email_daily_digest: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          timezone: 'America/Sao_Paulo',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating preferences:', insertError);
        return NextResponse.json(
          { error: 'Failed to create preferences' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: formatPreferences(newPrefs),
        timezones: TIMEZONES,
      });
    }

    return NextResponse.json({
      data: formatPreferences(prefs),
      timezones: TIMEZONES,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const userId = session.user?.id;

    // Build update object, mapping front-end field names to database columns
    const updateData: Record<string, boolean | string> = {};

    const fieldMap: Record<string, string> = {
      taskAssigned: 'email_task_assigned',
      statusChanged: 'email_status_changed',
      commentMention: 'email_comment_mention',
      deadlineApproaching: 'email_deadline_approaching',
      dailyDigest: 'email_daily_digest',
      quietHoursStart: 'quiet_hours_start',
      quietHoursEnd: 'quiet_hours_end',
      timezone: 'timezone',
    };

    for (const [frontEndKey, dbColumn] of Object.entries(fieldMap)) {
      if (body[frontEndKey] !== undefined) {
        updateData[dbColumn] = body[frontEndKey];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: updatedPrefs, error } = await supabase
      .from('notification_preferences')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: formatPreferences(updatedPrefs),
      timezones: TIMEZONES,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Format database preferences to front-end format
 */
function formatPreferences(prefs: Record<string, boolean | null>) {
  return {
    taskAssigned: prefs.email_task_assigned ?? true,
    statusChanged: prefs.email_status_changed ?? true,
    commentMention: prefs.email_comment_mention ?? true,
    deadlineApproaching: prefs.email_deadline_approaching ?? true,
    dailyDigest: prefs.email_daily_digest ?? false,
    quietHoursStart: prefs.quiet_hours_start ?? '22:00',
    quietHoursEnd: prefs.quiet_hours_end ?? '08:00',
    timezone: prefs.timezone ?? 'America/Sao_Paulo',
    lastModifiedAt: prefs.updated_at || prefs.created_at,
  };
}
