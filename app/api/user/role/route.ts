/**
 * GET /api/user/role - Get current user's role and permissions
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

export async function GET() {
  try {
    // 1. Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'unknown',
          email: 'unknown',
          role: 'executor',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        roleInfo: {
          currentRole: 'executor',
          validRoles: ['ceo', 'lider', 'executor'],
          canCreateTasks: false
        },
      });
    }

    try {
      console.log('=== USER ROLE CHECK ===');
      console.log('Session user ID:', session.user.id);
      console.log('Session user email:', session.user.email);
      console.log('Session user role:', session.user.role);

      // 2. Create Supabase client
      const sessionWithToken = session as Session & { accessToken?: string };
      const supabase = createSupabaseServerClient(sessionWithToken.accessToken);

      if (!supabase) {
        return NextResponse.json({
          success: true,
          user: {
            id: session.user.id,
            email: session.user.email || 'unknown',
            role: 'executor',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          roleInfo: {
            currentRole: 'executor',
            validRoles: ['admin', 'executor', 'viewer'],
            canCreateTasks: false
          },
        });
      }

      // 3. Fetch current user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, role, created_at, updated_at')
        .eq('id', session.user.id)
        .single();

      console.log('User from DB:', user);
      console.log('Error from DB:', error);

      if (error) {
        return NextResponse.json({
          success: true,
          user: {
            id: session.user.id,
            email: session.user.email || 'unknown',
            role: session.user.role || 'executor',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          roleInfo: {
            currentRole: session.user.role || 'executor',
            validRoles: ['admin', 'executor', 'viewer'],
            canCreateTasks: session.user.role === 'admin' || session.user.role === 'executor'
          },
        });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        roleInfo: {
          currentRole: user.role,
          validRoles: ['ceo', 'lider', 'executor'],
          canCreateTasks: user.role === 'admin' || user.role === 'executor'
        },
        availableActions: {
          setRole: {
            endpoint: '/api/user/set-role?role=ceo',
            description: 'Update role to ceo (CEO)',
            method: 'POST'
          }
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email || 'unknown',
          role: 'executor',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        roleInfo: {
          currentRole: 'executor',
          validRoles: ['ceo', 'lider', 'executor'],
          canCreateTasks: false
        },
      });
    }

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: true,
      user: {
        id: 'unknown',
        email: 'unknown',
        role: 'executor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      roleInfo: {
        currentRole: 'executor',
        validRoles: ['ceo', 'lider', 'executor'],
        canCreateTasks: false
      },
    });
  }
}
