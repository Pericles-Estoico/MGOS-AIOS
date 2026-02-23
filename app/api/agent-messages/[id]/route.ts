/**
 * GET /api/agent-messages/[id] — Get specific message
 * PATCH /api/agent-messages/[id] — Update message (soft delete)
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ data: null });
    }

    try {
      const messageId = params.id;

      const supabase = createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json({ data: null });
      }

      // Get message (user can only see their own)
      const { data: message, error } = await supabase
        .from('agent_messages')
        .select('*')
        .eq('id', messageId)
        .eq('user_id', session.user.id)
        .is('user_deleted_at', null)
        .single();

      if (error?.code === 'PGRST116') {
        return NextResponse.json({ data: null });
      }

      if (error || !message) {
        return NextResponse.json({ data: null });
      }

      return NextResponse.json(message);
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ data: null });
    }
  } catch (error) {
    console.error('Error fetching agent message:', error);
    return NextResponse.json({ data: null });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ data: null });
    }

    try {
      const messageId = params.id;
      const body = await request.json();
      const { agentResponse, responseMetadata, status, errorMessage } = body;

      const supabase = createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json({ data: null });
      }

      // Verify ownership
      const { data: existing } = await supabase
        .from('agent_messages')
        .select('id')
        .eq('id', messageId)
        .eq('user_id', session.user.id)
        .single();

      if (!existing) {
        return NextResponse.json({ data: null });
      }

      // Update message
      const { data, error } = await supabase
        .from('agent_messages')
        .update({
          agent_response: agentResponse || null,
          response_metadata: responseMetadata || null,
          status: status || 'completed',
          error_message: errorMessage || null,
        })
        .eq('id', messageId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ data: null });
      }

      return NextResponse.json(data[0] || null);
    } catch (parseError) {
      console.error('Request parsing error:', parseError);
      return NextResponse.json({ data: null });
    }
  } catch (error) {
    console.error('Error updating agent message:', error);
    return NextResponse.json({ data: null });
  }
}
