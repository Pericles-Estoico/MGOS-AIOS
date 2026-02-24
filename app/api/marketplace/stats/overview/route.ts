/**
 * GET /api/marketplace/stats/overview
 * Get overall marketplace statistics
 */

import { createSupabaseServerClient } from '@lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Get channels stats
    const { data: channels, error: channelsError } = await supabase
      .from('marketplace_channels')
      .select('*');

    if (channelsError?.code === 'PGRST116') {
      // Table doesn't exist yet
      return NextResponse.json({
        totalChannels: 0,
        activeChannels: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingApproval: 0,
        averageCompletionTime: 0,
      });
    }

    if (channelsError) throw channelsError;

    // Calculate stats from channels
    const totalChannels = channels?.length || 0;
    const activeChannels = channels?.filter(c => c.status === 'active' || c.status === 'ativo').length || 0;
    const totalTasks = channels?.reduce((sum, c) => sum + (c.tasks_generated || 0), 0) || 0;
    const completedTasks = channels?.reduce((sum, c) => sum + (c.tasks_completed || 0), 0) || 0;
    const approvedTasks = channels?.reduce((sum, c) => sum + (c.tasks_approved || 0), 0) || 0;
    const pendingApproval = Math.max(0, totalTasks - approvedTasks);
    const avgCompletionTime = totalChannels > 0 
      ? channels!.reduce((sum, c) => sum + (c.avg_completion_time_minutes || 0), 0) / totalChannels / 60 
      : 0;

    return NextResponse.json({
      totalChannels,
      activeChannels,
      totalTasks,
      completedTasks,
      pendingApproval,
      averageCompletionTime: Math.round(avgCompletionTime * 10) / 10,
    });
  } catch (error) {
    console.error('Error fetching marketplace overview:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
