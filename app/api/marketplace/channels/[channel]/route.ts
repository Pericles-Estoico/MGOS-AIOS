/**
 * GET /api/marketplace/channels/[channel]
 * Get analytics and performance data for a specific marketplace channel
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface ChannelAnalytics {
  channel: string;
  name: string;
  tasksGenerated: number;
  tasksApproved: number;
  tasksCompleted: number;
  tasksRejected: number;
  approvalRate: number;
  completionRate: number;
  avgCompletionTime: number;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  agentPerformance: {
    agent: string;
    tasksCreated: number;
    successRate: number;
  };
}

const AGENT_NAMES: Record<string, string> = {
  amazon: 'Alex (Amazon)',
  mercadolivre: 'Marina (MercadoLivre)',
  shopee: 'Sunny (Shopee)',
  shein: 'Tren (Shein)',
  tiktok: 'Viral (TikTok Shop)',
  kaway: 'Premium (Kaway)',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { channel: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Check authorization
    const userRole = (session.user as unknown as Record<string, unknown>)?.role;
    if (!userRole || !['admin', 'head'].includes(userRole as string)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const channel = params.channel as string;

    // Validate channel
    if (!Object.keys(AGENT_NAMES).includes(channel)) {
      return NextResponse.json(
        { error: 'Channel não encontrado' },
        { status: 404 }
      );
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Fetch all tasks for this channel
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status, priority, created_at, updated_at, admin_approved')
      .eq('source_type', 'ai_generated')
      .eq('channel', channel)
      .order('created_at', { ascending: false });

    // Fallback if tasks table doesn't exist
    if (tasksError?.code === 'PGRST116' || tasksError?.message?.includes('does not exist')) {
      return NextResponse.json({
        data: {
          channel,
          name: AGENT_NAMES[channel] || 'Unknown',
          tasksGenerated: 0,
          tasksApproved: 0,
          tasksCompleted: 0,
          tasksRejected: 0,
          approvalRate: 0,
          completionRate: 0,
          avgCompletionTime: 0,
          recentTasks: [],
          agentPerformance: {
            agent: AGENT_NAMES[channel] || 'Unknown',
            tasksCreated: 0,
            successRate: 0,
          },
        }
      });
    }

    const tasksGenerated = tasks?.length || 0;
    const tasksApproved = tasks?.filter(t => t.admin_approved && t.status !== 'rejected').length || 0;
    const tasksCompleted = tasks?.filter(t => t.status === 'completed').length || 0;
    const tasksRejected = tasks?.filter(t => t.status === 'rejected').length || 0;

    // Calculate rates
    const approvalRate = tasksGenerated > 0 ? (tasksApproved / tasksGenerated) * 100 : 0;
    const completionRate = tasksGenerated > 0 ? (tasksCompleted / tasksGenerated) * 100 : 0;

    // Calculate average completion time
    let avgCompletionTime = 0;
    const completedTasks = tasks?.filter(t => t.status === 'completed') || [];
    if (completedTasks.length > 0) {
      const times = completedTasks.map(task => {
        const created = new Date(task.created_at).getTime();
        const updated = new Date(task.updated_at).getTime();
        return (updated - created) / (1000 * 60 * 60 * 24); // Convert to days
      });
      avgCompletionTime = times.reduce((a, b) => a + b, 0) / times.length;
    }

    // Get recent tasks
    const recentTasks = (tasks || [])
      .slice(0, 5)
      .map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        createdAt: task.created_at,
      }));

    // Build response
    const response: ChannelAnalytics = {
      channel,
      name: AGENT_NAMES[channel] || 'Unknown',
      tasksGenerated,
      tasksApproved,
      tasksCompleted,
      tasksRejected,
      approvalRate: parseFloat(approvalRate.toFixed(1)),
      completionRate: parseFloat(completionRate.toFixed(1)),
      avgCompletionTime: parseFloat(avgCompletionTime.toFixed(1)),
      recentTasks,
      agentPerformance: {
        agent: AGENT_NAMES[channel] || 'Unknown',
        tasksCreated: tasksGenerated,
        successRate: parseFloat(completionRate.toFixed(1)),
      },
    };

    return NextResponse.json(
      { data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching channel analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
