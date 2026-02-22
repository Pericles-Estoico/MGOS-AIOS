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
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Get role from query param
    const { searchParams } = new URL(request.url);
    const newRole = searchParams.get('role');

    if (!newRole || !['ceo', 'lider', 'executor'].includes(newRole)) {
      return NextResponse.json(
        {
          error: 'Role inválido. Roles válidos: ceo, lider, executor',
          received: newRole
        },
        { status: 400 }
      );
    }

    // 3. Create Supabase client
    const sessionWithToken = session as Session & { accessToken?: string };
    const supabase = createSupabaseServerClient(sessionWithToken.accessToken);

    if (!supabase) {
      return NextResponse.json(
        { error: 'Banco de dados não configurado' },
        { status: 503 }
      );
    }

    // 4. Update user role in database
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', session.user.id)
      .select('id, email, role')
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: 'Erro ao atualizar role',
          details: error.message
        },
        { status: 500 }
      );
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

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno', details: String(error) },
      { status: 500 }
    );
  }
}
