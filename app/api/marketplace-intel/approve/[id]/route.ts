/**
 * API Route: /api/marketplace-intel/approve/[id]
 *
 * Endpoint for Admin to Approve/Reject AI-Generated Tasks:
 * PATCH  - Approve and assign AI task (admin only)
 *
 * Purpose: Admin workflow for reviewing and activating AI-generated task cards
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client (use anon key for user-authenticated operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// PATCH: Approve AI-Generated Task Card
// ============================================================================
/**
 * Approves an AI-generated task and optionally assigns it to a user.
 * Only accessible to authenticated users with admin role.
 *
 * Request body:
 * {
 *   "assigned_to": "user-uuid",        // (optional) Assign to executor
 *   "estimated_hours": 6.5,            // (optional) Override AI estimate
 *   "priority": "high",                // (optional) Adjust priority
 *   "note": "Reviewed and approved..."  // (optional) Admin notes
 * }
 *
 * Response: Updated task with admin_approved=true
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado - por favor, faça login' },
        { status: 401 }
      );
    }

    // 2. Check admin role
    const user = session.user as any;
    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem aprovar tarefas de inteligência' },
        { status: 403 }
      );
    }

    // 3. Validate task ID format
    if (!params.id || params.id.length !== 36) {
      return NextResponse.json(
        { error: 'Invalid task ID format' },
        { status: 400 }
      );
    }

    // 4. Parse request body
    const body = await request.json();

    // 5. Fetch current task to validate
    const { data: currentTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', params.id)
      .eq('source_type', 'ai_generated')
      .eq('admin_approved', false)
      .single();

    if (fetchError || !currentTask) {
      return NextResponse.json(
        {
          error: 'Task not found or already approved',
          details: fetchError?.message,
        },
        { status: 404 }
      );
    }

    // 6. Prepare update data
    const updateData: any = {
      admin_approved: true,
      updated_at: new Date().toISOString(),
    };

    // Optional: Override estimated hours
    if (body.estimated_hours !== undefined && body.estimated_hours > 0) {
      updateData.estimated_hours = body.estimated_hours;
    }

    // Optional: Adjust priority
    const validPriorities = ['high', 'medium', 'low'];
    if (body.priority && validPriorities.includes(body.priority)) {
      updateData.priority = body.priority;
    }

    // Optional: Assign to user
    if (body.assigned_to) {
      // Validate user exists and has executor role
      const { data: assignee, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', body.assigned_to)
        .single();

      if (userError || !assignee) {
        return NextResponse.json(
          { error: 'Assigned user not found' },
          { status: 400 }
        );
      }

      if (assignee.role !== 'executor') {
        return NextResponse.json(
          { error: 'Can only assign to executor role' },
          { status: 400 }
        );
      }

      updateData.assigned_to = body.assigned_to;
      updateData.status = 'a_fazer'; // Ensure status is set for assignment
    } else {
      // If no assignee provided, leave assigned_to as placeholder
      // Admin can assign later via standard task assignment flow
      updateData.status = 'a_fazer';
    }

    // 7. Update task in database
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to approve task',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // 8. Log approval action (for audit trail)
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert([
        {
          entity_type: 'task',
          entity_id: params.id,
          action: 'AI_TASK_APPROVED',
          changed_by: user?.id,
          old_values: { admin_approved: false },
          new_values: { admin_approved: true, ...updateData },
        },
      ]);

    if (auditError) {
      console.warn('Audit log failed (non-blocking):', auditError);
    }

    // 9. Return updated task
    return NextResponse.json(
      {
        success: true,
        task: updatedTask,
        message: `AI task approved and ready for execution${
          body.assigned_to ? ' - assigned to executor' : ' - awaiting assignment'
        }`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/marketplace-intel/approve/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE: Reject AI-Generated Task (Optional)
// ============================================================================
/**
 * Rejects an AI-generated task (marks as deleted or moves to rejected status).
 * Only accessible to authenticated users with admin role.
 *
 * This endpoint allows admin to discard low-quality or false-positive AI tasks.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado - por favor, faça login' },
        { status: 401 }
      );
    }

    // 2. Check admin role
    const user = session.user as any;
    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem rejeitar tarefas de inteligência' },
        { status: 403 }
      );
    }

    // 3. Validate task exists and is pending
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', params.id)
      .eq('source_type', 'ai_generated')
      .eq('admin_approved', false)
      .single();

    if (fetchError || !task) {
      return NextResponse.json(
        { error: 'Task not found or already processed' },
        { status: 404 }
      );
    }

    // 4. Delete the task
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to reject task', details: deleteError.message },
        { status: 500 }
      );
    }

    // 5. Log rejection action
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert([
        {
          entity_type: 'task',
          entity_id: params.id,
          action: 'AI_TASK_REJECTED',
          changed_by: user?.id,
          old_values: { id: params.id, source_type: 'ai_generated' },
          new_values: { status: 'deleted' },
        },
      ]);

    if (auditError) {
      console.warn('Audit log failed (non-blocking):', auditError);
    }

    // 6. Return success
    return NextResponse.json(
      {
        success: true,
        message: 'AI task rejected and removed from pending queue',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/marketplace-intel/approve/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
