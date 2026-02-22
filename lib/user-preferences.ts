/**
 * User Preferences & Profile Management
 * Story 3.2: User Management System Phase 2
 *
 * Handles user notification preferences, quiet hours, and profile data
 */

import { createClient } from '@supabase/supabase-js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return supabaseClient;
}

// Type definitions
export interface UserPreferences {
  id: string;
  userId: string;
  taskAssigned: boolean;
  statusChanged: boolean;
  commentMention: boolean;
  deadlineApproaching: boolean;
  dailyDigest: boolean;
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string;
  timezone: string;
  lastModifiedAt?: string;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreferenceUpdate {
  taskAssigned?: boolean;
  statusChanged?: boolean;
  commentMention?: boolean;
  deadlineApproaching?: boolean;
  dailyDigest?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

/**
 * Get user notification preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      return null;
    }

    const preferences = data as unknown as Record<string, unknown>;
    return {
      id: preferences.id as string,
      userId: preferences.user_id as string,
      taskAssigned: (preferences.task_assigned ?? true) as boolean,
      statusChanged: (preferences.status_changed ?? true) as boolean,
      commentMention: (preferences.comment_mention ?? true) as boolean,
      deadlineApproaching: (preferences.deadline_approaching ?? true) as boolean,
      dailyDigest: (preferences.daily_digest ?? false) as boolean,
      quietHoursStart: preferences.quiet_hours_start as string | undefined,
      quietHoursEnd: preferences.quiet_hours_end as string | undefined,
      timezone: (preferences.timezone || 'UTC') as string,
      lastModifiedAt: preferences.last_modified_at as string | undefined,
      isActive: (preferences.is_active ?? true) as boolean,
    };
  } catch (err) {
    console.error('Unexpected error fetching preferences:', err);
    return null;
  }
}

/**
 * Update user notification preferences
 */
export async function updatePreferences(
  userId: string,
  updates: PreferenceUpdate
): Promise<UserPreferences | null> {
  try {
    const supabase = getSupabaseClient();

    // Validate quiet hours format if provided
    if (updates.quietHoursStart) {
      validateTimeFormat(updates.quietHoursStart);
    }
    if (updates.quietHoursEnd) {
      validateTimeFormat(updates.quietHoursEnd);
    }

    // Call RPC to increment version
    await supabase.rpc('increment_preference_version', { user_id: userId });

    const updateData: Record<string, unknown> = {
      task_assigned: updates.taskAssigned,
      status_changed: updates.statusChanged,
      comment_mention: updates.commentMention,
      deadline_approaching: updates.deadlineApproaching,
      daily_digest: updates.dailyDigest,
      quiet_hours_start: updates.quietHoursStart,
      quiet_hours_end: updates.quietHoursEnd,
      timezone: updates.timezone,
      last_modified_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('notification_preferences')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return null;
    }

    // Log change in audit log
    await logPreferenceChange(userId, 'preferences_updated', null, JSON.stringify(updates));

    return {
      id: data.id,
      userId: data.user_id,
      taskAssigned: data.task_assigned,
      statusChanged: data.status_changed,
      commentMention: data.comment_mention,
      deadlineApproaching: data.deadline_approaching,
      dailyDigest: data.daily_digest,
      quietHoursStart: data.quiet_hours_start,
      quietHoursEnd: data.quiet_hours_end,
      timezone: data.timezone,
      lastModifiedAt: data.last_modified_at,
      isActive: data.is_active,
    };
  } catch (err) {
    console.error('Error updating preferences:', err);
    return null;
  }
}

/**
 * Check if notification type is enabled for user
 */
export async function isNotificationEnabled(
  userId: string,
  notificationType: 'task_assigned' | 'status_changed' | 'comment_mention' | 'deadline_approaching' | 'daily_digest'
): Promise<boolean> {
  const prefs = await getUserPreferences(userId);
  if (!prefs || !prefs.isActive) {
    return false;
  }

  const typeMap: Record<string, keyof UserPreferences> = {
    task_assigned: 'taskAssigned',
    status_changed: 'statusChanged',
    comment_mention: 'commentMention',
    deadline_approaching: 'deadlineApproaching',
    daily_digest: 'dailyDigest',
  };

  return (prefs[typeMap[notificationType]] as boolean) ?? false;
}

/**
 * Check if current time is within quiet hours
 */
export async function isInQuietHours(userId: string): Promise<boolean> {
  const prefs = await getUserPreferences(userId);
  if (!prefs || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const userTime = new Date(
    now.toLocaleString('en-US', { timeZone: prefs.timezone })
  );

  const [startHour, startMin] = prefs.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number);

  const currentTime = userTime.getHours() * 60 + userTime.getMinutes();
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Quiet hours span midnight
    return currentTime >= startTime || currentTime < endTime;
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    const profile = data as unknown as Record<string, unknown>;
    return {
      id: profile.id as string,
      userId: profile.user_id as string,
      displayName: profile.display_name as string | undefined,
      avatarUrl: profile.avatar_url as string | undefined,
      bio: profile.bio as string | undefined,
      timezone: (profile.timezone || 'UTC') as string,
      language: (profile.language || 'pt-BR') as string,
      createdAt: (profile.created_at || '') as string,
      updatedAt: (profile.updated_at || '') as string,
    };
  } catch (err) {
    console.error('Unexpected error fetching profile:', err);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<UserProfile | null> {
  try {
    const supabase = getSupabaseClient();
    const updateData: Record<string, unknown> = {
      display_name: updates.displayName,
      avatar_url: updates.avatarUrl,
      bio: updates.bio,
      timezone: updates.timezone,
      language: updates.language,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      timezone: data.timezone,
      language: data.language,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('Error updating profile:', err);
    return null;
  }
}

/**
 * Validate time format (HH:MM) - Requires leading zeros
 */
export function validateTimeFormat(time: string): boolean {
  const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!regex.test(time)) {
    throw new Error(`Invalid time format: ${time}. Expected HH:MM (e.g., 08:30, 23:59)`);
  }
  return true;
}

/**
 * Log preference change in audit log
 */
async function logPreferenceChange(
  userId: string,
  preferenceKey: string,
  oldValue: string | null,
  newValue: string | null
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('preference_audit_log').insert({
      user_id: userId,
      preference_key: preferenceKey,
      old_value: oldValue,
      new_value: newValue,
      changed_at: new Date().toISOString(),
      changed_by: 'user',
    });
  } catch (err) {
    console.error('Error logging preference change:', err);
  }
}

/**
 * Reset preferences to defaults for user
 */
export async function resetToDefaults(userId: string): Promise<UserPreferences | null> {
  const defaults: PreferenceUpdate = {
    taskAssigned: true,
    statusChanged: true,
    commentMention: true,
    deadlineApproaching: true,
    dailyDigest: false,
    quietHoursStart: undefined,
    quietHoursEnd: undefined,
    timezone: 'UTC',
  };

  try {
    await logPreferenceChange(userId, 'preferences_reset', null, JSON.stringify(defaults));
    return updatePreferences(userId, defaults);
  } catch (err) {
    console.error('Error resetting preferences:', err);
    return null;
  }
}

/**
 * Validate preference update
 */
export function validatePreferences(updates: PreferenceUpdate): string[] {
  const errors: string[] = [];

  if (updates.quietHoursStart) {
    try {
      validateTimeFormat(updates.quietHoursStart);
    } catch (err) {
      errors.push(`Invalid quietHoursStart: ${(err as Error).message}`);
    }
  }

  if (updates.quietHoursEnd) {
    try {
      validateTimeFormat(updates.quietHoursEnd);
    } catch (err) {
      errors.push(`Invalid quietHoursEnd: ${(err as Error).message}`);
    }
  }

  if (updates.quietHoursStart && updates.quietHoursEnd) {
    const [startHour, startMin] = updates.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = updates.quietHoursEnd.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime === endTime) {
      errors.push('quietHoursStart and quietHoursEnd cannot be the same');
    }
  }

  if (updates.timezone && !getSupportedTimezones().includes(updates.timezone)) {
    errors.push(`Invalid timezone: ${updates.timezone}`);
  }

  return errors;
}

/**
 * Get supported timezones
 */
export function getSupportedTimezones(): string[] {
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Amsterdam',
    'Europe/Istanbul',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Singapore',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Brisbane',
    'Australia/Perth',
    'Pacific/Auckland',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'America/Buenos_Aires',
  ];
}
