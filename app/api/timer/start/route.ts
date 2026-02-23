/**
 * POST /api/timer/start
 * @description Start a timer session for a task
 * @auth Required (executor role)
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

interface TimerStartPayload {
  task_id: string;
  description?: string;
}

interface TimerSession {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  status: 'running';
  elapsed_seconds: number;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Get session
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    let payload: TimerStartPayload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { task_id, description } = payload;

    // 3. Validate required fields
    if (!task_id) {
      return NextResponse.json(
        { error: 'Missing required field: task_id' },
        { status: 400 }
      );
    }

    // 4. Create Supabase client
    const sessionWithToken = session as Session & { accessToken?: string };
    const supabase = createSupabaseServerClient(sessionWithToken.accessToken);

    if (!supabase) {
      return NextResponse.json(
        {
          success: true,
          timer: {
            id: `timer-${Date.now()}`,
            task_id,
            user_id: session.user.id,
            started_at: new Date().toISOString(),
            status: 'running',
            elapsed_seconds: 0,
            description
          }
        }
      );
    }

    // 5. Verify task exists and is assigned to user
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, assigned_to, status')
      .eq('id', task_id)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // 6. Check if task is assigned to user
    if (task.assigned_to !== session.user.id) {
      return NextResponse.json(
        { error: 'Task not assigned to you' },
        { status: 403 }
      );
    }

    // 7. Check if timer already running for this user
    // (Store in Redis or database - for now, assume OK)

    // 8. Update task status to "fazendo" if currently "a_fazer"
    if (task.status === 'a_fazer') {
      await supabase
        .from('tasks')
        .update({
          status: 'fazendo',
          started_at: new Date().toISOString()
        })
        .eq('id', task_id);
    }

    // 9. Create timer session
    const timerSession: TimerSession = {
      id: `timer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      task_id,
      user_id: session.user.id,
      started_at: new Date().toISOString(),
      status: 'running',
      elapsed_seconds: 0,
      description
    };

    // 10. Log in audit trail
    await supabase.from('audit_logs').insert({
      entity_type: 'timer_session',
      entity_id: timerSession.id,
      action: 'INSERT',
      old_values: null,
      new_values: timerSession,
      changed_by: session.user.id,
      changed_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      timer: timerSession
    });

  } catch (error) {
    console.error('Error starting timer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
