/**
 * API Routes: /api/orchestration/tasks/complete
 * Endpoints for task completion
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { TaskManager } from '@/lib/marketplace-orchestration/task-manager';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

/**
 * PATCH: Mark task as completed
 * Team members can complete their assigned tasks
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.taskId || typeof body.actualHours !== 'number') {
      return NextResponse.json(
        { error: 'taskId and actualHours are required' },
        { status: 400 }
      );
    }

    const taskManager = new TaskManager(session.user?.email || undefined);
    const updatedTask = await taskManager.completeTask(body, session.user?.id || 'unknown');

    // Calculate time accuracy
    const accuracy = ((updatedTask.estimatedHours - (updatedTask.actualHours || 0)) / updatedTask.estimatedHours) * 100;

    return NextResponse.json(
      {
        success: true,
        message: 'Task completed successfully',
        task: updatedTask,
        stats: {
          estimatedHours: updatedTask.estimatedHours,
          actualHours: updatedTask.actualHours,
          accuracy: Math.round(accuracy),
          completedAt: updatedTask.completedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/orchestration/tasks/complete error:', error);
    return NextResponse.json(
      { error: 'Failed to complete task', details: String(error) },
      { status: 500 }
    );
  }
}
