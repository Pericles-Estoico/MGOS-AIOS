/**
 * API Routes: /api/orchestration/tasks
 * Endpoints for marketplace task management
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TaskManager } from '@/lib/marketplace-orchestration/task-manager';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

/**
 * POST: Create new task from sub-agent
 * Only authorized sub-agents can create tasks
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const isAuthorizedAgent = authHeader?.startsWith('Bearer marketplace-');

    if (!isAuthorizedAgent) {
      return NextResponse.json(
        { error: 'Unauthorized - marketplace agent token required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['marketplace', 'title', 'description', 'category', 'priority', 'estimatedHours', 'createdBy'];
    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const taskManager = new TaskManager();
    const task = await taskManager.createTask(body);

    return NextResponse.json(
      {
        success: true,
        task,
        message: 'Task created and awaiting approval',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/orchestration/tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET: List tasks (pending approval, by status, etc)
 * Only authenticated users can view
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const marketplace = searchParams.get('marketplace');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const taskManager = new TaskManager(session.user?.email);

    let tasks;
    if (marketplace) {
      const allTasks = await taskManager.getTasksByMarketplace(marketplace, status || undefined);
      tasks = allTasks.slice(offset, offset + limit);
    } else {
      const result = await taskManager.getPendingApproval(limit, offset);
      tasks = result.tasks;
    }

    return NextResponse.json({
      tasks,
      count: tasks.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('GET /api/orchestration/tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: String(error) },
      { status: 500 }
    );
  }
}
