import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

/**
 * GET /api/marketplace/analysis
 * List analysis plans with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Authorization check (admin/head/qa only)
    const userRole = session.user?.role as string;
    if (!['admin', 'head', 'qa'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar análises' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Banco de dados não disponível' },
        { status: 500 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const channel = url.searchParams.get('channel');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    // Build query
    let query = supabase
      .from('marketplace_plans')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (channel) {
      query = query.contains('channels', [channel]);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: plans, count, error } = await query;

    if (error) {
      console.error('Error fetching analysis plans:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar análises' },
        { status: 500 }
      );
    }

    // Get pending count for badge
    const { count: pendingCount } = await supabase
      .from('marketplace_plans')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    return NextResponse.json({
      plans: plans || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      pendingCount: pendingCount || 0,
    });
  } catch (error) {
    console.error('Error in analysis list:', error);
    return NextResponse.json(
      {
        error: 'Erro ao listar análises',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
