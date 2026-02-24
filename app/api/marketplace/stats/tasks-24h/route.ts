/**
 * GET /api/marketplace/stats/tasks-24h
 * Get marketplace tasks created in last 24 hours
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';
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

    // Get tasks created in last 24 hours
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: tasksLast24h, error } = await supabase
      .from('tasks')
      .select('channel, status')
      .eq('source_type', 'ai_generated')
      .gte('created_at', last24h)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    // Group by channel
    const byChannel: Record<string, number> = {
      amazon: 0,
      mercadolivre: 0,
      shopee: 0,
      shein: 0,
      tiktok: 0,
      kaway: 0,
    };

    tasksLast24h?.forEach(task => {
      const channel = task.channel as string;
      if (channel in byChannel) {
        byChannel[channel]++;
      }
    });

    return NextResponse.json(
      {
        total: tasksLast24h?.length || 0,
        byChannel,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching tasks 24h stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
