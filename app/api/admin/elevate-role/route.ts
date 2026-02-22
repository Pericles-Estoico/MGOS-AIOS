/**
 * TEMPORARY ENDPOINT: Elevate Current User Role to Admin
 *
 * ⚠️  SECURITY WARNING - FOR FIRST-TIME SETUP ONLY
 *
 * This endpoint allows an authenticated user to elevate their own role to 'admin'.
 * It should be REMOVED after initial setup is complete.
 *
 * Use case: Database user role not synced during initial deployment
 *
 * DELETE THIS FILE after: User can create tasks successfully
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado - faça login primeiro' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const email = session.user.email;

    console.log(`🔧 Elevando role do usuário: ${email} (${userId})`);

    // 2. Create Supabase client
    const sessionWithToken = session as Session & { accessToken?: string };
    const supabase = createSupabaseServerClient(sessionWithToken.accessToken);

    if (!supabase) {
      return NextResponse.json(
        { error: 'Banco de dados não configurado' },
        { status: 503 }
      );
    }

    // 3. Update user role to admin
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar role:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar permissão', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Sucesso! Role do usuário atualizado para admin`);

    return NextResponse.json(
      {
        success: true,
        message: '✅ Sua permissão foi elevada para admin! Você agora pode criar tarefas.',
        user: {
          id: data.id,
          email: data.email,
          role: data.role,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro em POST /api/admin/elevate-role:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: String(error) },
      { status: 500 }
    );
  }
}
