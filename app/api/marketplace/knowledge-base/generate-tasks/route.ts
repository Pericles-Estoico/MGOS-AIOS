/**
 * NEXO Knowledge Base Task Generation
 * POST /api/marketplace/knowledge-base/generate-tasks
 * Generate actual marketplace tasks from approved knowledge base entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';

interface TaskGenerationRequest {
  knowledgeBaseIds: string[];
  marketplaces: string[];
  autoApprove?: boolean; // If true, skip approval and create tasks immediately
}

/**
 * POST - Generate tasks from approved knowledge base entries
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role as string;
    if (!['admin', 'head'].includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - only admin/head can generate tasks' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as TaskGenerationRequest;
    const { knowledgeBaseIds, marketplaces, autoApprove = false } = body;

    if (!knowledgeBaseIds || knowledgeBaseIds.length === 0) {
      return NextResponse.json({ error: 'No knowledge base entries provided' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Fetch knowledge base entries
    const { data: entries, error: fetchError } = await supabase
      .from('knowledge_base')
      .select('*')
      .in('id', knowledgeBaseIds);

    if (fetchError || !entries) {
      return NextResponse.json({ error: 'Failed to fetch knowledge base entries' }, { status: 500 });
    }

    const createdTasks: any[] = [];

    // For each marketplace, create optimization tasks
    for (const marketplace of marketplaces) {
      for (const entry of entries) {
        // Create Phase 1 task (Strategic)
        const phase1Task = {
          title: `Strategic Optimization: ${entry.filename}`,
          description: `Apply knowledge from "${entry.filename}" to optimize ${marketplace}.\n\nAnalysis:\n${entry.analysis.summary}\n\nKey Insights:\n${entry.analysis.keyInsights.join('\n')}`,
          phase: 1,
          channel: marketplace,
          status: autoApprove ? 'pending' : 'pending_approval',
          knowledgeBaseId: entry.id,
          createdBy: session.user.id,
          createdAt: new Date().toISOString(),
          requiresApproval: !autoApprove,
          marketplaceInstructions: entry.analysis.recommendations
            .filter((rec: string) => rec.includes(marketplace))
            .join('\n'),
        };

        const { data: phase1, error: phase1Error } = await supabase
          .from('tasks')
          .insert([phase1Task])
          .select()
          .single();

        if (!phase1Error && phase1) {
          createdTasks.push(phase1);
        }

        // Create Phase 2 task (Execution) if auto-approved
        if (autoApprove) {
          const phase2Task = {
            title: `Execute Optimization: ${entry.filename} - ${marketplace}`,
            description: `Execute optimization strategy from knowledge base for ${marketplace}.`,
            phase: 2,
            channel: marketplace,
            status: 'pending',
            parentTaskId: phase1?.id,
            knowledgeBaseId: entry.id,
            createdBy: session.user.id,
            createdAt: new Date().toISOString(),
          };

          const { data: phase2 } = await supabase
            .from('tasks')
            .insert([phase2Task])
            .select()
            .single();

          if (phase2) {
            createdTasks.push(phase2);
          }
        }
      }
    }

    console.log(`✅ Generated ${createdTasks.length} tasks from knowledge base`);

    return NextResponse.json({
      status: 'success',
      message: `Generated ${createdTasks.length} tasks from knowledge base`,
      tasks: createdTasks,
      summary: {
        total: createdTasks.length,
        phase1: createdTasks.filter((t) => t.phase === 1).length,
        phase2: createdTasks.filter((t) => t.phase === 2).length,
        requiresApproval: createdTasks.filter((t) => t.requiresApproval).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Task generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate tasks',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET - List knowledge base entries
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role as string;
    if (!['admin', 'head', 'qa'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const marketplace = searchParams.get('marketplace');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    let query = supabase.from('knowledge_base').select('*').order('uploadedAt', { ascending: false }).limit(limit);

    if (marketplace) {
      query = query.contains('marketplaces', [marketplace]);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch knowledge base' }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      entries: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch knowledge base',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
