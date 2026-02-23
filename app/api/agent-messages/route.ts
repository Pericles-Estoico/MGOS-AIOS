/**
 * GET /api/agent-messages — List user's messages
 * POST /api/agent-messages — Create new message
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const agentName = searchParams.get('agent');
    const channel = searchParams.get('channel');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Build query
    let query = supabase
      .from('agent_messages')
      .select('*')
      .eq('user_id', session.user.id)
      .is('user_deleted_at', null)
      .order('created_at', { ascending: false });

    if (agentName) {
      query = query.eq('agent_name', agentName);
    }

    if (channel) {
      query = query.eq('channel', channel);
    }

    // Get total count
    const { count } = await supabase
      .from('agent_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .is('user_deleted_at', null);

    // Get paginated data
    const { data: messages, error } = await query.range(offset, offset + limit - 1);

    if (error?.code === 'PGRST116') {
      // Table doesn't exist yet - return empty
      return NextResponse.json({
        messages: [],
        total: 0,
        limit,
        offset,
      });
    }

    if (error) throw error;

    return NextResponse.json({
      messages,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching agent messages:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar mensagens' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      agentName,
      userMessage,
      agentResponse,
      responseMetadata,
      messageType = 'general',
      channel,
      analysisId,
      taskId,
    } = body;

    // Validate required fields
    if (!agentName || !userMessage) {
      return NextResponse.json(
        { error: 'agentName e userMessage são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Insert message
    const { data, error } = await supabase.from('agent_messages').insert({
      user_id: session.user.id,
      agent_name: agentName,
      user_message: userMessage,
      agent_response: agentResponse || null,
      response_metadata: responseMetadata || null,
      message_type: messageType,
      channel: channel || null,
      analysis_id: analysisId || null,
      task_id: taskId || null,
      status: agentResponse ? 'completed' : 'pending',
    });

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Agent messages table não existe ainda' },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating agent message:', error);
    return NextResponse.json(
      { error: 'Erro ao criar mensagem' },
      { status: 500 }
    );
  }
}
