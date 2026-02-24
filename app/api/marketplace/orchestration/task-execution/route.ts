/**
 * NEXO Task Execution Tracking - Phase 3
 * Monitor execução de tarefas em tempo real
 * GET /api/marketplace/orchestration/task-execution
 * PATCH /api/marketplace/orchestration/task-execution/{taskId}
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';

interface TaskExecution {
  taskId: string;
  status: 'pending' | 'in_progress' | 'marketplace_sync' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  marketplace: string;
  channel: string;
  agentId: string;
  timeEstimate: number; // minutes
  timeSpent: number; // minutes
  lastUpdate: string;
  syncStatus?: {
    amazon?: boolean;
    mercadolivre?: boolean;
    shopee?: boolean;
    shein?: boolean;
    tiktokshop?: boolean;
    kaway?: boolean;
  };
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    let query = supabase.from('tasks').select('*');

    if (taskId) {
      query = query.eq('id', taskId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (channel) {
      query = query.eq('channel', channel);
    }

    const { data: tasks, error } = await query.order('created_at', { ascending: false }).limit(limit);

    if (error) {
      console.error('Task fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Transform to task execution format
    const executions: TaskExecution[] = (tasks || []).map((task) => {
      const createdAt = new Date(task.created_at).getTime();
      const now = new Date().getTime();
      const timeSpent = Math.floor((now - createdAt) / (1000 * 60)); // minutes

      let progress = 0;
      let executionStatus: TaskExecution['status'] = 'pending';

      if (task.status === 'completed') {
        progress = 100;
        executionStatus = 'completed';
      } else if (task.status === 'in_progress') {
        progress = 50;
        executionStatus = 'in_progress';
      } else if (task.status === 'approved') {
        progress = 25;
        executionStatus = 'marketplace_sync';
      } else if (task.status === 'rejected' || task.status === 'cancelled') {
        executionStatus = 'failed';
      }

      return {
        taskId: task.id,
        status: executionStatus,
        progress,
        startedAt: task.started_at,
        completedAt: task.completed_at,
        marketplace: task.channel,
        channel: task.channel,
        agentId: task.created_by_agent || 'unknown',
        timeEstimate: task.estimated_hours * 60,
        timeSpent,
        lastUpdate: new Date().toISOString(),
        syncStatus: {
          amazon: task.channel === 'amazon' && task.status === 'completed',
          mercadolivre: task.channel === 'mercadolivre' && task.status === 'completed',
          shopee: task.channel === 'shopee' && task.status === 'completed',
          shein: task.channel === 'shein' && task.status === 'completed',
          tiktokshop: task.channel === 'tiktokshop' && task.status === 'completed',
          kaway: task.channel === 'kaway' && task.status === 'completed',
        },
      };
    });

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      totalTasks: executions.length,
      tasks: executions,
      summary: {
        pending: executions.filter((t) => t.status === 'pending').length,
        inProgress: executions.filter((t) => t.status === 'in_progress').length,
        completed: executions.filter((t) => t.status === 'completed').length,
        failed: executions.filter((t) => t.status === 'failed').length,
        totalProgress: executions.length > 0 ? Math.round(executions.reduce((sum, t) => sum + t.progress, 0) / executions.length) : 0,
      },
    });
  } catch (error) {
    console.error('Task execution fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch task execution status',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role as string;
    if (!['admin', 'head', 'qa'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { taskId, status, progress, syncStatus } = body;

    if (!taskId || !status) {
      return NextResponse.json({ error: 'Missing taskId or status' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Update task
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else if (status === 'in_progress' && !body.startedAt) {
      updateData.started_at = new Date().toISOString();
    }

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Task update error:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    console.log(`✅ Task ${taskId} updated: status=${status}, progress=${progress || 'N/A'}`);

    return NextResponse.json({
      status: 'success',
      message: 'Task execution updated',
      task: updatedTask,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Task execution update error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update task execution',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
