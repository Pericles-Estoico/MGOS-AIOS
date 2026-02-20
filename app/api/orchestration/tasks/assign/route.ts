/**
 * API Routes: /api/orchestration/tasks/assign
 * Endpoints for task assignment to team members
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TaskManager } from '@/lib/marketplace-orchestration/task-manager';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

/**
 * PATCH: Assign task to team member
 * Only admin users can assign
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

    // Check admin role
    if (session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can assign tasks' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.taskId || !body.assignedTo) {
      return NextResponse.json(
        { error: 'taskId and assignedTo are required' },
        { status: 400 }
      );
    }

    const taskManager = new TaskManager(session.user?.email);
    const updatedTask = await taskManager.assignTask(body, session.user?.id || 'unknown');

    return NextResponse.json(
      {
        success: true,
        message: 'Task assigned successfully',
        task: updatedTask,
        assignedAt: updatedTask.startedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/orchestration/tasks/assign error:', error);
    return NextResponse.json(
      { error: 'Failed to assign task', details: String(error) },
      { status: 500 }
    );
  }
}
