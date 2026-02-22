/**
 * GET /api/marketplace/stats/overview
 * Get overall marketplace statistics
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

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

    // Get total tasks
    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('source_type', 'ai_generated');

    // Get completed tasks
    const { count: completedTasks } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('source_type', 'ai_generated')
      .eq('status', 'completed');

    // Get pending approval
    const { count: pendingApproval } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('source_type', 'ai_generated')
      .eq('status', 'pending')
      .eq('admin_approved', false);

    // Get unique channels
    const { data: channels } = await supabase
      .from('tasks')
      .select('channel')
      .eq('source_type', 'ai_generated')
      .neq('channel', null);

    const uniqueChannels = new Set(channels?.map(c => c.channel) || []);
    const totalChannels = 6; // Fixed: Amazon, MercadoLivre, Shopee, Shein, TikTok, Kaway
    const activeChannels = Math.min(uniqueChannels.size, 6);

    // Get average completion time (days)
    const { data: completedTasksData } = await supabase
      .from('tasks')
      .select('created_at, updated_at')
      .eq('source_type', 'ai_generated')
      .eq('status', 'completed')
      .limit(10);

    let avgCompletionTime = 3.5;
    if (completedTasksData && completedTasksData.length > 0) {
      const times = completedTasksData.map(task => {
        const created = new Date(task.created_at).getTime();
        const updated = new Date(task.updated_at).getTime();
        return (updated - created) / (1000 * 60 * 60 * 24); // Convert to days
      });
      avgCompletionTime = times.reduce((a, b) => a + b, 0) / times.length;
    }

    return NextResponse.json(
      {
        totalChannels,
        activeChannels,
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        pendingApproval: pendingApproval || 0,
        averageCompletionTime: parseFloat(avgCompletionTime.toFixed(1)),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
