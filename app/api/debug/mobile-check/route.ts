import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';

/**
 * GET /api/debug/mobile-check
 * Debug endpoint to check what's broken on mobile
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);

    // Check 1: Authentication
    const authStatus: any = session
      ? { ok: true, user: session.user.email, role: session.user.role }
      : { ok: false, error: 'Not authenticated' };

    // Check 2: Supabase connection
    let dbStatus: any = { ok: false, error: 'Supabase not configured' };
    const supabase = createSupabaseServerClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('marketplace_plans')
          .select('count(*)', { count: 'exact' });
        dbStatus = error
          ? { ok: false, error: error.message }
          : { ok: true, error: 'Database connected' };
      } catch (err) {
        dbStatus = { ok: false, error: err instanceof Error ? err.message : 'Database error' };
      }
    }

    // Check 3: Analysis count
    let analysisStatus: any = { ok: false, error: 'Not checked', count: 0 };
    if (supabase) {
      try {
        const { count, error } = await supabase
          .from('marketplace_plans')
          .select('id', { count: 'exact', head: true });
        analysisStatus =
          error || !count
            ? { ok: false, error: error?.message || 'No analyses', count: 0 }
            : { ok: true, error: 'Analyses exist', count };
      } catch (err) {
        analysisStatus = { ok: false, error: err instanceof Error ? err.message : 'Query error', count: 0 };
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      checks: {
        authentication: authStatus,
        database: dbStatus,
        analysisData: analysisStatus,
      },
      allOk: authStatus.ok && dbStatus.ok && analysisStatus.ok,
      nextSteps: [
        !authStatus.ok && '❌ NOT AUTHENTICATED - Login required',
        !dbStatus.ok && '❌ DATABASE ERROR - Check SUPABASE connection',
        analysisStatus.count === 0 && '⚠️ NO ANALYSES - Run auto-approve first',
        authStatus.ok && dbStatus.ok && analysisStatus.count > 0 && '✅ ALL CHECKS PASSED',
      ].filter(Boolean),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
