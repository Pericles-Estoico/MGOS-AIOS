/**
 * GET /api/marketplace/channels/[channel]
 * Get analytics and performance data for a specific marketplace channel
 * Now using marketplace_channels table (no more hardcoded data!)
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface ChannelAnalytics {
  id: string;
  channel: string;
  name: string;
  agentName: string;
  tasksGenerated: number;
  tasksApproved: number;
  tasksCompleted: number;
  tasksRejected: number;
  approvalRate: number;
  completionRate: number;
  avgCompletionTime: number;
  revenueLastWeek: number;
  opportunitiesCount: number;
  totalItems: number;
  conversionRate: number;
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

    const channelKey = params.channel as string;

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Fetch channel from marketplace_channels table (REAL DATA!)
    const { data: channelData, error: channelError } = await supabase
      .from('marketplace_channels')
      .select('*')
      .eq('channel_key', channelKey)
      .single();

    // Fallback if channel not found
    if (channelError || !channelData) {
      return NextResponse.json(
        { error: 'Channel não encontrado' },
        { status: 404 }
      );
    }

    // Fetch recent tasks for this channel (for UI display)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status, priority, created_at, updated_at, admin_approved')
      .eq('source_type', 'ai_generated')
      .eq('channel', channelKey)
      .order('created_at', { ascending: false })
      .limit(5);

    // Recent tasks fallback to empty array if tasks table doesn't exist
    const recentTasksList = tasksError?.code === 'PGRST116' ? [] : (tasks || []);

    // Build response with REAL data from marketplace_channels table
    const response: ChannelAnalytics = {
      id: channelData.id,
      channel: channelData.channel_key,
      name: channelData.name,
      agentName: channelData.agent_name,
      tasksGenerated: channelData.tasks_generated || 0,
      tasksApproved: channelData.tasks_approved || 0,
      tasksCompleted: channelData.tasks_completed || 0,
      tasksRejected: channelData.tasks_rejected || 0,
      approvalRate: channelData.approval_rate || 0,
      completionRate: channelData.completion_rate || 0,
      avgCompletionTime: channelData.avg_completion_time_minutes || 0,
      revenueLastWeek: channelData.revenue_7days || 0,
      opportunitiesCount: channelData.opportunities_count || 0,
      totalItems: channelData.total_items || 0,
      conversionRate: channelData.conversion_rate || 0,
      recentTasks: recentTasksList.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        createdAt: task.created_at,
      })),
      agentPerformance: {
        agent: channelData.agent_name,
        tasksCreated: channelData.tasks_generated || 0,
        successRate: channelData.completion_rate || 0,
      },
    };

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error) {
    console.error('Error fetching channel analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
