/**
 * DEBUG ENDPOINT: Check Current User Role
 * Returns the current user's role from the database
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
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Create Supabase client
    const sessionWithToken = session as Session & { accessToken?: string };
    const supabase = createSupabaseServerClient(sessionWithToken.accessToken);

    if (!supabase) {
      return NextResponse.json(
        { error: 'Banco de dados não configurado' },
        { status: 503 }
      );
    }

    // 3. Fetch current user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', session.user.id)
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: 'Usuário não encontrado no banco',
          sessionRole: session.user.role || 'undefined',
          details: error.message
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        roleInDatabase: user.role,
        roleInSession: session.user.role,
        canCreateTasks: ['admin', 'head'].includes(user.role)
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro', details: String(error) },
      { status: 500 }
    );
  }
}
