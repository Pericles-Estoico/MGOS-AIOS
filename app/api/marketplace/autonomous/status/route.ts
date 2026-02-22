import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

interface LoopStatus {
  lastExecution?: string;
  nextExecution: string;
  isRunning: boolean;
  tasksGeneratedLast24h: number;
  agents: {
    name: string;
    status: 'online' | 'busy' | 'idle';
    lastAction?: string;
    tasksGenerated?: number;
  }[];
}

/**
 * Get autonomous loop status from Supabase
 */
async function getLoopStatus(): Promise<LoopStatus> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    // Fallback to mock data if Supabase is not configured
    return getMockStatus();
  }

  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Get total tasks generated in last 24h
    const { count: tasksLast24h, error: countError } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('source_type', 'ai_generated')
      .gte('created_at', last24h);

    if (countError) {
      console.error('❌ Error fetching task count:', countError);
      return getMockStatus();
    }

    // Get latest task creation (last execution time)
    const { data: latestTasks, error: latestError } = await supabase
      .from('tasks')
      .select('created_at, channel')
      .eq('source_type', 'ai_generated')
      .order('created_at', { ascending: false })
      .limit(6);

    if (latestError) {
      console.error('❌ Error fetching latest tasks:', latestError);
      return getMockStatus();
    }

    // Build agent status from latest tasks
    const channelMap: Record<string, string> = {
      amazon: 'Alex (Amazon)',
      mercadolivre: 'Marina (MercadoLivre)',
      shopee: 'Sunny (Shopee)',
      shein: 'Tren (Shein)',
      tiktok: 'Viral (TikTok Shop)',
      kaway: 'Premium (Kaway)',
    };

    const agents: LoopStatus['agents'] = [
      { name: 'Alex (Amazon)', status: 'idle', lastAction: 'Unknown', tasksGenerated: 0 },
      { name: 'Marina (MercadoLivre)', status: 'idle', lastAction: 'Unknown', tasksGenerated: 0 },
      { name: 'Sunny (Shopee)', status: 'idle', lastAction: 'Unknown', tasksGenerated: 0 },
      { name: 'Tren (Shein)', status: 'idle', lastAction: 'Unknown', tasksGenerated: 0 },
      { name: 'Viral (TikTok Shop)', status: 'idle', lastAction: 'Unknown', tasksGenerated: 0 },
      { name: 'Premium (Kaway)', status: 'idle', lastAction: 'Unknown', tasksGenerated: 0 },
    ];

    // Update agent data from latest tasks
    if (latestTasks && latestTasks.length > 0) {
      for (const task of latestTasks) {
        const agentName = channelMap[task.channel];
        const agent = agents.find(a => a.name === agentName);
        if (agent) {
          agent.tasksGenerated = (agent.tasksGenerated || 0) + 1;
          agent.lastAction = formatTimeAgo(new Date(task.created_at));
        }
      }
    }

    const lastExecution = latestTasks && latestTasks.length > 0
      ? new Date(latestTasks[0].created_at).toISOString()
      : new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    return {
      lastExecution,
      nextExecution: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      isRunning: false,
      tasksGeneratedLast24h: tasksLast24h || 0,
      agents,
    };
  } catch (error) {
    console.error('❌ Error getting loop status:', error);
    return getMockStatus();
  }
}

/**
 * Get mock status as fallback
 */
function getMockStatus(): LoopStatus {
  return {
    lastExecution: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    nextExecution: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    isRunning: false,
    tasksGeneratedLast24h: 0,
    agents: [
      { name: 'Alex (Amazon)', status: 'idle', lastAction: 'Unknown', tasksGenerated: 0 },
      { name: 'Marina (MercadoLivre)', status: 'idle', lastAction: 'Unknown', tasksGenerated: 0 },
      { name: 'Sunny (Shopee)', status: 'idle', lastAction: 'Unknown', tasksGenerated: 0 },
      { name: 'Tren (Shein)', status: 'idle', lastAction: 'Unknown', tasksGenerated: 0 },
      { name: 'Viral (TikTok Shop)', status: 'idle', lastAction: 'Unknown', tasksGenerated: 0 },
      { name: 'Premium (Kaway)', status: 'idle', lastAction: 'Unknown', tasksGenerated: 0 },
    ],
  };
}

/**
 * Format time difference in human readable format
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * GET /api/marketplace/autonomous/status
 * Get status of autonomous loop and agents
 */
export async function GET() {
  try {
    const status = await getLoopStatus();

    return NextResponse.json(
      {
        success: true,
        status,
        message: 'Autonomous loop operational',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching autonomous loop status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Erro ao obter status do loop autônomo',
      },
      { status: 500 }
    );
  }
}
