/**
 * GET /api/marketplace/stats/channels
 * Get per-channel statistics
 */

import { createSupabaseServerClient } from '@lib/supabase';
import { NextResponse } from 'next/server';

interface ChannelStatus {
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

const CHANNEL_ICONS = {
  amazon: '🛒',
  mercadolivre: '🎯',
  shopee: '🏪',
  shein: '👗',
  tiktok: '📱',
  kaway: '💎',
};

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Get channels data
    const { data: channels, error: channelsError } = await supabase
      .from('marketplace_channels')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (channelsError) {
      // Tabela não existe ou outro erro — retorna vazio sem falhar
      return NextResponse.json({ channels: [] });
    }

    // Transform to ChannelStatus format
    const channelStatus: ChannelStatus[] = (channels || []).map(channel => ({
      channel: channel.channel_key,
      name: channel.name,
      icon: CHANNEL_ICONS[channel.channel_key as keyof typeof CHANNEL_ICONS] || '📦',
      status: channel.status === 'active' || channel.status === 'ativo' ? 'online' : 'offline',
      tasksCreated: channel.tasks_generated || 0,
      tasksApproved: channel.tasks_approved || 0,
      tasksCompleted: channel.tasks_completed || 0,
      avgCompletionTime: (channel.avg_completion_time_minutes || 0) / 60, // Convert to hours
      performance: channel.completion_rate || 0,
    }));

    return NextResponse.json({ channels: channelStatus });
  } catch (error) {
    console.error('Error fetching channel stats:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar stats dos canais' },
      { status: 500 }
    );
  }
}
