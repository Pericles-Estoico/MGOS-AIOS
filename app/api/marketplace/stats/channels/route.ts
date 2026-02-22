/**
 * GET /api/marketplace/stats/channels
 * Get per-channel marketplace statistics
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

interface ChannelStats {
  channel: string;
  name: string;
  icon: string;
  status: 'online' | 'offline' | 'warning';
  tasksCreated: number;
  tasksApproved: number;
  tasksCompleted: number;
  avgCompletionTime: number;
  performance: number;
}

const CHANNEL_CONFIG: Record<string, { name: string; icon: string }> = {
  amazon: { name: 'Amazon', icon: '🛒' },
  mercadolivre: { name: 'MercadoLivre', icon: '🎯' },
  shopee: { name: 'Shopee', icon: '🏪' },
  shein: { name: 'SHEIN', icon: '👗' },
  tiktok: { name: 'TikTok Shop', icon: '📱' },
  kaway: { name: 'Kaway', icon: '💎' },
};

export async function GET() {
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

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const channelStats: ChannelStats[] = [];

    for (const [channelId, config] of Object.entries(CHANNEL_CONFIG)) {
      // Get tasks for this channel
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status, admin_approved, created_at, updated_at')
        .eq('source_type', 'ai_generated')
        .eq('channel', channelId);

      const tasksCreated = tasks?.length || 0;
      const tasksApproved = tasks?.filter(t => t.admin_approved).length || 0;
      const tasksCompleted = tasks?.filter(t => t.status === 'completed').length || 0;

      // Calculate average completion time
      let avgCompletionTime = 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed') || [];
      if (completedTasks.length > 0) {
        const times = completedTasks.map(task => {
          const created = new Date(task.created_at).getTime();
          const updated = new Date(task.updated_at).getTime();
          return (updated - created) / (1000 * 60 * 60 * 24);
        });
        avgCompletionTime = times.reduce((a, b) => a + b, 0) / times.length;
      }

      // Calculate performance (completion rate %)
      const performance = tasksCreated > 0
        ? Math.round((tasksCompleted / tasksCreated) * 100)
        : 0;

      // Determine status (online if tasks created recently)
      let status: 'online' | 'offline' | 'warning' = 'offline';
      if (tasksCreated > 0) {
        status = performance >= 70 ? 'online' : 'warning';
      }

      channelStats.push({
        channel: channelId,
        name: config.name,
        icon: config.icon,
        status,
        tasksCreated,
        tasksApproved,
        tasksCompleted,
        avgCompletionTime: parseFloat(avgCompletionTime.toFixed(1)),
        performance,
      });
    }

    return NextResponse.json(
      { channels: channelStats },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching channel stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
