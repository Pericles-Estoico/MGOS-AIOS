/**
 * GET /api/marketplace/channels
 * List all marketplace channels with analytics
 * PUBLIC ENDPOINT - No authentication required
 */

import { createSupabaseServerClient } from '@lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface ChannelRow {
  id: string;
  channel_key: string;
  name: string;
  marketplace_type: string;
  agent_name: string;
  status: string;
  tasks_generated: number;
  tasks_approved: number;
  tasks_completed: number;
  tasks_rejected: number;
  approval_rate: number;
  completion_rate: number;
  avg_completion_time_minutes: number;
  revenue_7days: number;
  opportunities_count: number;
  total_items: number;
  conversion_rate: number;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Build query
    let query = supabase.from('marketplace_channels').select('*');

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Get total count
    const { count } = await supabase
      .from('marketplace_channels')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    // Get paginated data
    const { data: channels, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      // Fallback: return empty array if table doesn't exist
      if (
        error.code === 'PGRST116' ||
        error.message?.includes('relation "public.marketplace_channels" does not exist')
      ) {
        return NextResponse.json({
          channels: [],
          total: 0,
          limit,
          offset,
        });
      }
      throw error;
    }

    return NextResponse.json({
      channels: channels as ChannelRow[],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching marketplace channels:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar canais' },
      { status: 500 }
    );
  }
}
