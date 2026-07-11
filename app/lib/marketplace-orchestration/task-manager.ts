/**
 * Task Manager - Gerencia o ciclo de vida das tarefas
 */

import { createSupabaseServerClient } from '@lib/supabase';
import type {
  MarketplaceTask,
  TaskStatus,
  TaskApprovalRequest,
  TaskAssignmentRequest,
  TaskCompletionRequest
} from './types';

// Maps camelCase MarketplaceTask fields → snake_case DB columns for INSERT
function toDbRow(task: Omit<MarketplaceTask, 'id'>) {
  return {
    marketplace: task.marketplace,
    created_by_agent: task.createdBy,
    title: task.title,
    description: task.description,
    category: task.category,
    status: task.status,
    approved_at: task.approvedAt,
    started_at: task.startedAt,
    completed_at: task.completedAt,
    assigned_to: task.assignedTo,
    approved_by: task.approvedBy,
    estimated_hours: task.estimatedHours,
    actual_hours: task.actualHours,
    priority: task.priority,
    tags: task.tags,
    metadata: task.metadata,
  };
}

// Maps snake_case DB row → camelCase MarketplaceTask
function fromDbRow(row: Record<string, unknown>): MarketplaceTask {
  return {
    id: row.id as string,
    marketplace: row.marketplace as MarketplaceTask['marketplace'],
    createdBy: (row.created_by_agent as string) || '',
    title: row.title as string,
    description: row.description as string,
    category: row.category as MarketplaceTask['category'],
    status: row.status as TaskStatus,
    createdAt: row.created_at as string,
    approvedAt: row.approved_at as string | undefined,
    startedAt: row.started_at as string | undefined,
    completedAt: row.completed_at as string | undefined,
    assignedTo: row.assigned_to as string | undefined,
    approvedBy: row.approved_by as string | undefined,
    estimatedHours: (row.estimated_hours as number) || 0,
    actualHours: row.actual_hours as number | undefined,
    priority: row.priority as MarketplaceTask['priority'],
    tags: row.tags as string[] | undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
  };
}

export class TaskManager {
  constructor(private accessToken?: string) {}

  /**
   * Create a new task from sub-agent
   */
  async createTask(task: Omit<MarketplaceTask, 'id' | 'createdAt'>) {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    const row = toDbRow({ ...task, createdAt: new Date().toISOString() });

    const { data, error } = await supabase
      .from('marketplace_tasks')
      .insert([{ ...row, created_at: new Date().toISOString(), status: 'pending' }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create task: ${error.message}`);
    return fromDbRow(data as Record<string, unknown>);
  }

  /**
   * Get pending tasks for approval
   */
  async getPendingApproval(limit = 50, offset = 0) {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error, count } = await supabase
      .from('marketplace_tasks')
      .select('*', { count: 'exact' })
      .in('status', ['pending', 'awaiting_approval'])
      .eq('admin_approved', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
    return {
      tasks: (data || []).map(r => fromDbRow(r as Record<string, unknown>)) as MarketplaceTask[],
      total: count || 0,
    };
  }

  /**
   * Approve tasks in batch
   */
  async approveTasks(request: TaskApprovalRequest, userId: string) {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    const { approved, taskIds, reason } = request;
    const now = new Date().toISOString();

    const updateData = approved
      ? {
          status: 'approved' as TaskStatus,
          admin_approved: true,
          approved_by: userId,
          approved_at: now,
        }
      : {
          status: 'rejected' as TaskStatus,
          admin_approved: false,
          rejected_by: userId,
          rejected_at: now,
          rejection_reason: reason || 'Rejeitado pelo administrador',
        };

    const { data, error } = await supabase
      .from('marketplace_tasks')
      .update(updateData)
      .in('id', taskIds)
      .select();

    if (error) throw new Error(`Failed to approve tasks: ${error.message}`);
    return (data || []).map(r => fromDbRow(r as Record<string, unknown>)) as MarketplaceTask[];
  }

  /**
   * Assign task to team member
   */
  async assignTask(request: TaskAssignmentRequest, userId: string) {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('marketplace_tasks')
      .update({
        assigned_to: request.assignedTo,
        assigned_by: userId,
        status: 'in_progress' as TaskStatus,
        started_at: new Date().toISOString(),
      })
      .eq('id', request.taskId)
      .eq('status', 'approved')
      .select()
      .single();

    if (error) throw new Error(`Failed to assign task: ${error.message}`);
    return fromDbRow(data as Record<string, unknown>);
  }

  /**
   * Mark task as completed
   */
  async completeTask(request: TaskCompletionRequest, userId: string) {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('marketplace_tasks')
      .update({
        status: 'completed' as TaskStatus,
        completed_at: new Date().toISOString(),
        completed_by: userId,
        actual_hours: request.actualHours,
        ...(request.notes && { completion_notes: request.notes }),
      })
      .eq('id', request.taskId)
      .select()
      .single();

    if (error) throw new Error(`Failed to complete task: ${error.message}`);
    return fromDbRow(data as Record<string, unknown>);
  }

  /**
   * Get tasks by listing_id
   */
  async getTasksByListingId(listingId: string, status?: string) {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    let query = supabase
      .from('marketplace_tasks')
      .select('*')
      .eq('listing_id', listingId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch tasks by listing: ${error.message}`);
    return (data || []).map(r => fromDbRow(r as Record<string, unknown>)) as MarketplaceTask[];
  }

  /**
   * Get tasks by marketplace
   */
  async getTasksByMarketplace(marketplace: string, status?: string) {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    let query = supabase
      .from('marketplace_tasks')
      .select('*')
      .eq('marketplace', marketplace);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
    return (data || []).map(r => fromDbRow(r as Record<string, unknown>)) as MarketplaceTask[];
  }

  /**
   * Get task statistics
   */
  async getDailyStats() {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('marketplace_tasks')
      .select('marketplace, status, admin_approved, created_at')
      .gte('created_at', since.toISOString());

    if (error) throw new Error(`Failed to fetch stats: ${error.message}`);

    const stats: Record<string, { created: number; approved: number; inProgress: number; completed: number }> = {};
    for (const task of data || []) {
      if (!stats[task.marketplace]) {
        stats[task.marketplace] = { created: 0, approved: 0, inProgress: 0, completed: 0 };
      }
      stats[task.marketplace].created++;
      if (task.admin_approved) stats[task.marketplace].approved++;
      if (task.status === 'in_progress') stats[task.marketplace].inProgress++;
      if (task.status === 'completed') stats[task.marketplace].completed++;
    }

    return Object.entries(stats).map(([marketplace, s]) => ({ marketplace, ...s }));
  }
}
