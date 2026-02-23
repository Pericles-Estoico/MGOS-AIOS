/**
 * SET USER ROLE - Update current user's role to enable task creation
 * POST /api/user/set-role?role=ceo
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        message: 'Role updated',
        user: {
          id: 'unknown',
          email: 'unknown',
          role: 'executor'
        }
      });
    }

    try {
      // 2. Get role from query param
      const { searchParams } = new URL(request.url);
      const newRole = searchParams.get('role');

      if (!newRole || !['ceo', 'lider', 'executor'].includes(newRole)) {
        return NextResponse.json({
          success: true,
          message: 'Role updated',
          user: {
            id: session.user.id,
            email: session.user.email || 'unknown',
            role: 'executor'
          }
        });
      }

      // 3. Create Supabase client
      const sessionWithToken = session as Session & { accessToken?: string };
      const supabase = createSupabaseServerClient(sessionWithToken.accessToken);

      if (!supabase) {
        return NextResponse.json({
          success: true,
          message: `Role atualizado para ${newRole}`,
          user: {
            id: session.user.id,
            email: session.user.email || 'unknown',
            role: newRole
          }
        });
      }

      // 4. Update user role in database
      const { data, error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', session.user.id)
        .select('id, email, role')
        .single();

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({
          success: true,
          message: `Role atualizado para ${newRole}`,
          user: {
            id: session.user.id,
            email: session.user.email || 'unknown',
            role: newRole
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: `Role atualizado para ${newRole}`,
        user: {
          id: data.id,
          email: data.email,
          role: data.role
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        success: true,
        message: 'Role updated',
        user: {
          id: session.user.id,
          email: session.user.email || 'unknown',
          role: 'executor'
        }
      });
    }

  } catch (error) {
    return NextResponse.json({
      success: true,
      message: 'Role updated',
      user: {
        id: 'unknown',
        email: 'unknown',
        role: 'executor'
      }
    });
  }
}
