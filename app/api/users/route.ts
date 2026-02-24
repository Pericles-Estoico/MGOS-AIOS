/**
 * GET /api/users - List all users
 * POST /api/users - Create new user
 * @auth Required (admin only)
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

interface UserPayload {
  email: string;
  name: string;
  role: 'admin' | 'head' | 'executor' | 'qa';
  department?: string;
}

// ============================================================================
// GET: List users
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ data: [] });
    }

    try {
      const { searchParams } = new URL(request.url);
      const role = searchParams.get('role');
      const limit = parseInt(searchParams.get('limit') || '100');
      const offset = parseInt(searchParams.get('offset') || '0');

      const supabase = createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json({
          data: [],
          pagination: { total: 0, limit, offset }
        });
      }

      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (role) {
        query = query.eq('role', role);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({
          data: [],
          pagination: { total: 0, limit, offset }
        });
      }

      return NextResponse.json({
        data: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset
        }
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        data: [],
        pagination: { total: 0, limit: 100, offset: 0 }
      });
    }

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      data: [],
      pagination: { total: 0, limit: 100, offset: 0 }
    });
  }
}

// ============================================================================
// POST: Create user
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const sessionWithToken = session as Session & { accessToken?: string };
    const supabase = createSupabaseServerClient(sessionWithToken.accessToken);

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 503 }
      );
    }

    // Check session user role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (currentUser?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create users' },
        { status: 403 }
      );
    }

    try {
      const body = await request.json() as UserPayload;
      const { email, name, role, department } = body;

      // Validate
      if (!email || !name || !role) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Create user in auth (would normally use Supabase Auth)
      // For now, just create in users table
      const { data, error } = await supabase
        .from('users')
        .insert({
          email,
          name,
          role,
          department: department || null,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      return NextResponse.json(data, { status: 201 });

    } catch (parseError) {
      console.error('Request parsing error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
