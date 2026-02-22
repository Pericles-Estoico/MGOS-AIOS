/**
 * Notification Preferences Component
 * Story 3.2: User Management System Phase 2
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface NotificationPreference {
  id?: string;
  email_notifications?: boolean;
  slack_notifications?: boolean;
  push_notifications?: boolean;
  notification_frequency?: 'immediate' | 'daily' | 'weekly';
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

interface NotificationPreferencesProps {
  onSave?: (prefs: NotificationPreference) => void;
  onError?: (error: string) => void;
}

export function NotificationPreferences({
  onSave,
  onError,
}: NotificationPreferencesProps) {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [changes, setChanges] = useState<Record<string, unknown>>({});

  // Load preferences on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadPreferences();
    }
  }, [session?.user?.id]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/preferences');

      if (!response.ok) throw new Error('Failed to load preferences');

      const { data, timezones: tzs } = await response.json();
      setPreferences(data);
      setTimezones(tzs);
      setChanges({});
    } catch (error) {
      onError?.((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setChanges({
      ...changes,
      [key]: !changes[key],
    });
  };

  const handleTimeChange = (field: string, value: string) => {
    setChanges({
      ...changes,
      [field]: value,
    });
  };

  const handleTimezoneChange = (value: string) => {
    setChanges({
      ...changes,
      timezone: value,
    });
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) return;

    try {
      setSaving(true);
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changes),
      });

      if (!response.ok) throw new Error('Failed to save preferences');

      const { data } = await response.json();
      setPreferences(data);
      setChanges({});
      onSave?.(data);
    } catch (error) {
      onError?.((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setChanges({});
  };

  if (loading) {
    return <div className="p-4">Loading preferences...</div>;
  }

  if (!preferences) {
    return <div className="p-4 text-red-500">Failed to load preferences</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>

        {/* Notification Type Toggles */}
        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-lg">Email Notifications</h3>

          {[
            { key: 'taskAssigned', label: 'Task Assigned' },
            { key: 'statusChanged', label: 'Status Changed' },
            { key: 'commentMention', label: 'Comment Mention' },
            { key: 'deadlineApproaching', label: 'Deadline Approaching' },
            { key: 'dailyDigest', label: 'Daily Digest' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  (changes[key] as boolean) ??
                  (preferences[key as keyof any] as boolean)
                }
                onChange={() => handleToggle(key)}
                className="w-4 h-4"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        {/* Quiet Hours Configuration */}
        <div className="space-y-4 mb-8 border-t pt-6">
          <h3 className="font-semibold text-lg">Quiet Hours</h3>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Start Time (HH:MM)
            </label>
            <input
              type="time"
              value={
                (changes.quietHoursStart as string) ?? preferences.quietHoursStart ?? '22:00'
              }
              onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              End Time (HH:MM)
            </label>
            <input
              type="time"
              value={
                (changes.quietHoursEnd as string) ?? preferences.quietHoursEnd ?? '08:00'
              }
              onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Timezone</label>
            <select
              value={(changes.timezone as string) ?? preferences.timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Last Modified Info */}
        {preferences.lastModifiedAt && (
          <p className="text-xs text-gray-500">
            Last modified: {new Date(preferences.lastModifiedAt).toLocaleString()}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(changes).length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleReset}
            disabled={Object.keys(changes).length === 0}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:bg-gray-100"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
