/**
 * User Profile Component
 * Story 3.2: User Management System Phase 2
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UserProfileData {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  theme?: string;
  language?: string;
  timezone?: string;
  role?: string;
}

interface UserProfileProps {
  onSave?: (profile: UserProfileData) => void;
  onError?: (error: string) => void;
}

export function UserProfile({
  onSave,
  onError,
}: UserProfileProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<Record<string, unknown>>({});
  const [languages] = useState<string[]>(['pt-BR', 'en-US', 'es-ES', 'fr-FR']);

  // Load profile on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadProfile();
    }
  }, [session?.user?.id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');

      if (!response.ok) throw new Error('Failed to load profile');

      const { data } = await response.json();
      setProfile(data);
      setChanges({});
    } catch (error) {
      onError?.((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setChanges({
      ...changes,
      [field]: value,
    });
  };

  const handleLanguageChange = (value: string) => {
    setChanges({
      ...changes,
      language: value,
    });
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) return;

    try {
      setSaving(true);
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changes),
      });

      if (!response.ok) throw new Error('Failed to save profile');

      const { data } = await response.json();
      setProfile(data);
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
    return <div className="p-4">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="p-4 text-red-500">Failed to load profile</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">User Profile</h2>

        {/* Display Name */}
        <div className="space-y-2 mb-8">
          <label className="block text-sm font-medium">Display Name</label>
          <input
            type="text"
            maxLength={255}
            value={(changes.name as string) ?? profile.name ?? ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 border rounded"
          />
          <p className="text-xs text-gray-500">
            {(changes.name as string ?? profile.name ?? '').length}/255 characters
          </p>
        </div>

        {/* Avatar URL */}
        <div className="space-y-2 mb-8">
          <label className="block text-sm font-medium">Avatar URL</label>
          <input
            type="url"
            value={(changes.avatar as string) ?? profile.avatar ?? ''}
            onChange={(e) => handleInputChange('avatar', e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-3 py-2 border rounded"
          />
          {((changes.avatar as string) ?? profile.avatar) && (
            <div className="mt-2">
              <img
                src={(changes.avatar as string) ?? profile.avatar}
                alt="Avatar Preview"
                className="w-24 h-24 rounded-full object-cover"
                onError={() => onError?.('Invalid image URL')}
              />
            </div>
          )}
        </div>

        {/* Language */}
        <div className="space-y-2 mb-8">
          <label className="block text-sm font-medium">Language</label>
          <select
            value={(changes.language as string) ?? profile.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Timezone (Read-only reference) */}
        <div className="space-y-2 mb-8 bg-gray-50 p-4 rounded border border-gray-200">
          <label className="block text-sm font-medium">Timezone</label>
          <p className="text-sm text-gray-600">
            {(changes.timezone as string) ?? profile.timezone}
          </p>
          <p className="text-xs text-gray-500">
            Manage timezone in Notification Preferences
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
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
