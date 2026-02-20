/**
 * User Notification Preferences API
 * Story 3.2: User Management System Phase 2
 *
 * GET /api/user/preferences - Retrieve user's preferences
 * POST /api/user/preferences - Update user's preferences
 */

import { getUserPreferences, updatePreferences, getSupportedTimezones } from '@/lib/user-preferences';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/user/preferences
 * Retrieve user's notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authHeader.split(' ')[1]; // Extract user ID from token
    const preferences = await getUserPreferences(userId);

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: preferences,
      timezones: getSupportedTimezones(),
      notificationTypes: [
        { key: 'task_assigned', label: 'Task Assigned' },
        { key: 'status_changed', label: 'Status Changed' },
        { key: 'comment_mention', label: 'Comment Mention' },
        { key: 'deadline_approaching', label: 'Deadline Approaching' },
        { key: 'daily_digest', label: 'Daily Digest' },
      ],
    });
  } catch (error) {
    console.error('Error in GET /api/user/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface PreferenceUpdateRequest {
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
 * POST /api/user/preferences
 * Update user's notification preferences
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authHeader.split(' ')[1];
    const body: PreferenceUpdateRequest = await request.json();

    // Validate required fields
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Validate quiet hours format if provided
    if (body.quietHoursStart) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(body.quietHoursStart)) {
        return NextResponse.json(
          { error: 'Invalid quiet hours start format (HH:MM expected)' },
          { status: 400 }
        );
      }
    }

    if (body.quietHoursEnd) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(body.quietHoursEnd)) {
        return NextResponse.json(
          { error: 'Invalid quiet hours end format (HH:MM expected)' },
          { status: 400 }
        );
      }
    }

    const updatedPreferences = await updatePreferences(userId, body);

    if (!updatedPreferences) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: 'success',
        message: 'Preferences updated successfully',
        data: updatedPreferences,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/user/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
