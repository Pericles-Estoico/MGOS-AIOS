/**
 * User Profile API
 * Story 3.2: User Management System Phase 2
 *
 * GET /api/user/profile - Retrieve user's profile
 * PUT /api/user/profile - Update user's profile
 */

import { getUserProfile, updateUserProfile } from '@/lib/user-preferences';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/user/profile
 * Retrieve user's profile information
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

    const userId = authHeader.split(' ')[1];
    const profile = await getUserProfile(userId);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: profile,
    });
  } catch (error) {
    console.error('Error in GET /api/user/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface ProfileUpdateRequest {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  language?: string;
}

/**
 * PUT /api/user/profile
 * Update user's profile information
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authHeader.split(' ')[1];
    const body: ProfileUpdateRequest = await request.json();

    // Validate inputs
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    if (body.displayName && body.displayName.length > 255) {
      return NextResponse.json(
        { error: 'Display name too long (max 255 characters)' },
        { status: 400 }
      );
    }

    if (body.bio && body.bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio too long (max 500 characters)' },
        { status: 400 }
      );
    }

    const updatedProfile = await updateUserProfile(userId, body);

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: 'success',
        message: 'Profile updated successfully',
        data: updatedProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/user/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
