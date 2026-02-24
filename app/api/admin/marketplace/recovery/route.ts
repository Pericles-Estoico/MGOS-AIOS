/**
 * Marketplace Analysis Recovery Endpoint
 * Reprocesses stuck/failed analyses and requeues Phase 1 task creation
 *
 * Admin-only endpoint for incident recovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { enqueuePhase1Job } from '@lib/queue/phase1-queue';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userRole?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get request parameters
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'list'; // 'list' | 'reprocess' | 'reprocess-all'
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

    // Reprocess specific analyses
    if (action === 'reprocess' && planIds.length > 0) {
      const jobIds: string[] = [];
      const errors: { planId: string; error: string }[] = [];

      for (const planId of planIds) {
        try {
          // Fetch analysis plan
          const { data: plan, error: fetchError } = await supabase
            .from('marketplace_plans')
            .select('*')
            .eq('id', planId)
            .single();

          if (fetchError || !plan) {
            errors.push({ planId, error: 'Analysis not found' });
            continue;
          }

          // Enqueue job
          const jobId = await enqueuePhase1Job({
            planId,
            channels: plan.plan_data?.channels || [],
            opportunities: plan.plan_data?.opportunities || [],
            metadata: { reprocessed_at: new Date().toISOString() },
          });

          jobIds.push(jobId);
          console.log(`✅ Requeued analysis ${planId} as job ${jobId}`);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          errors.push({ planId, error: errorMessage });
          console.error(`❌ Failed to requeue analysis ${planId}:`, err);
        }
      }

      return NextResponse.json({
        status: 'success',
        message: `Reprocessed ${jobIds.length} analyses`,
        jobIds,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // Reprocess ALL stuck analyses
    if (action === 'reprocess-all') {
      // Fetch all stuck analyses
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
