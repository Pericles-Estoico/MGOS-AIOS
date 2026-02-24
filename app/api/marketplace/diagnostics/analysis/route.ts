import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@lib/supabase';

/**
 * GET /api/marketplace/diagnostics/analysis
 * Diagnóstico rápido do sistema de análises
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase not configured',
        databaseConnected: false,
      });
    }

    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from('marketplace_plans')
      .select('count(*)', { count: 'exact' });

    if (testError) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        databaseConnected: false,
        error: testError.message,
      });
    }

    // Get all analyses
    const { data: analyses, error: fetchError } = await supabase
      .from('marketplace_plans')
      .select('id, title, status, created_at, channels')
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to fetch analyses',
        databaseConnected: true,
        error: fetchError.message,
      });
    }

    // Get pending count
    const { count: pendingCount } = await supabase
      .from('marketplace_plans')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get approved count
    const { count: approvedCount } = await supabase
      .from('marketplace_plans')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');

    return NextResponse.json({
      status: 'success',
      databaseConnected: true,
      summary: {
        totalAnalyses: analyses?.length || 0,
        pendingAnalyses: pendingCount || 0,
        approvedAnalyses: approvedCount || 0,
      },
      recentAnalyses: analyses || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Diagnostics failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
