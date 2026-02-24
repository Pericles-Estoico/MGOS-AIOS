/**
 * Admin Recovery Endpoint (Incident Response)
 * Uses secret key instead of NextAuth for emergency incident recovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enqueuePhase1Job } from '@lib/queue/phase1-queue';

export async function POST(request: NextRequest) {
  try {
    // Check secret key (for incident recovery)
    const secretKey = request.headers.get('x-recovery-key');
    const expectedKey = process.env.ADMIN_RECOVERY_KEY;

    if (!secretKey || !expectedKey || secretKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid recovery key' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const body = await request.json().catch(() => ({}));
    const action = body.action || 'list';
    const planIds = body.planIds || [];

    // List stuck analyses
    if (action === 'list') {
      const { data: stuckAnalyses, error } = await supabase
        .from('marketplace_plans')
        .select('id, status, created_at, phase1_tasks_created, plan_data')
        .eq('status', 'approved')
        .eq('phase1_tasks_created', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching stuck analyses:', error);
        return NextResponse.json(
          { error: 'Failed to fetch stuck analyses' },
          { status: 500 }
        );
      }

      const stuckCount = stuckAnalyses?.length || 0;
      const oldestAnalysis = stuckAnalyses?.[0];
      const ageHours = oldestAnalysis
        ? Math.round(
            (Date.now() - new Date(oldestAnalysis.created_at).getTime()) /
              (1000 * 60 * 60)
          )
        : 0;

      return NextResponse.json({
        status: 'success',
        message: `Found ${stuckCount} stuck analyses`,
        stuckCount,
        ageHours,
        oldestAnalysis: oldestAnalysis?.id,
        analyses: stuckAnalyses || [],
      });
    }

    // Reprocess all stuck analyses
    if (action === 'reprocess-all') {
      const { data: stuckAnalyses, error: fetchError } = await supabase
        .from('marketplace_plans')
        .select('*')
        .eq('status', 'approved')
        .eq('phase1_tasks_created', false);

      if (fetchError) {
        console.error('Error fetching stuck analyses:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch stuck analyses' },
          { status: 500 }
        );
      }

      const jobIds: string[] = [];
      const errors: { planId: string; error: string }[] = [];

      for (const plan of stuckAnalyses || []) {
        try {
          const jobId = await enqueuePhase1Job({
            planId: plan.id,
            channels: plan.plan_data?.channels || [],
            opportunities: plan.plan_data?.opportunities || [],
            metadata: { reprocessed_at: new Date().toISOString(), bulk: true },
          });

          jobIds.push(jobId);
          console.log(`✅ Requeued analysis ${plan.id} as job ${jobId}`);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          errors.push({ planId: plan.id, error: errorMessage });
          console.error(`❌ Failed to requeue analysis ${plan.id}:`, err);
        }
      }

      return NextResponse.json({
        status: 'success',
        message: `Reprocessed ${jobIds.length} of ${stuckAnalyses?.length || 0} analyses`,
        totalStuck: stuckAnalyses?.length || 0,
        jobIds,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Recovery endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
