/**
 * API Routes: /api/orchestration/tasks/approve
 * Endpoints for task approval workflow
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { TaskManager } from '@/lib/marketplace-orchestration/task-manager';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

/**
 * PATCH: Approve or reject tasks in batch
 * Only admin users can approve
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
        { error: 'Only admins can approve tasks' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.taskIds || !Array.isArray(body.taskIds) || body.taskIds.length === 0) {
      return NextResponse.json(
        { error: 'taskIds array is required' },
        { status: 400 }
      );
    }

    if (typeof body.approved !== 'boolean') {
      return NextResponse.json(
        { error: 'approved boolean is required' },
        { status: 400 }
      );
    }

    const taskManager = new TaskManager(session.user?.email || undefined);
    const updatedTasks = await taskManager.approveTasks(body, session.user?.id || 'unknown');

    return NextResponse.json(
      {
        success: true,
        message: body.approved ? 'Tasks approved' : 'Tasks rejected',
        count: updatedTasks.length,
        tasks: updatedTasks,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/orchestration/tasks/approve error:', error);
    return NextResponse.json(
      { error: 'Failed to approve tasks', details: String(error) },
      { status: 500 }
    );
  }
}
