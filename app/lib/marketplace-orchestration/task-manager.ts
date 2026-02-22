/**
 * Task Manager - Gerencia o ciclo de vida das tarefas
 */

import { createSupabaseServerClient } from '@/lib/supabase';
import type {
  MarketplaceTask,
  TaskStatus,
  TaskApprovalRequest,
  TaskAssignmentRequest,
  TaskCompletionRequest
} from './types';

export class TaskManager {
  private supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  private supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  constructor(private accessToken?: string) {}

  /**
   * Create a new task from sub-agent
   */
  async createTask(task: Omit<MarketplaceTask, 'id' | 'createdAt'>) {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    const taskData = {
      ...task,
      createdAt: new Date().toISOString(),
      status: 'pending' as TaskStatus,
    };

    const { data, error } = await supabase
      .from('marketplace_tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create task: ${error.message}`);
    return data as MarketplaceTask;
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
      .eq('status', 'awaiting_approval')
      .order('submittedAt', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
    return { tasks: (data || []) as MarketplaceTask[], total: count || 0 };
  }

  /**
   * Approve tasks in batch
   */
  async approveTasks(request: TaskApprovalRequest, userId: string) {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    const { approved, taskIds, reason } = request;
    const newStatus: TaskStatus = approved ? 'approved' : 'rejected';
    const now = new Date().toISOString();

    const updateData = {
      status: newStatus,
      [approved ? 'approvedAt' : 'rejectedAt']: now,
      [approved ? 'approvedBy' : 'rejectedBy']: userId,
      ...(reason && { rejectionReason: reason }),
    };

    const { data, error } = await supabase
      .from('marketplace_tasks')
      .update(updateData)
      .in('id', taskIds)
      .select();

    if (error) throw new Error(`Failed to approve tasks: ${error.message}`);
    return data as MarketplaceTask[];
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
        assignedTo: request.assignedTo,
        status: 'in_progress' as TaskStatus,
        startedAt: new Date().toISOString(),
      })
      .eq('id', request.taskId)
      .select()
      .single();

    if (error) throw new Error(`Failed to assign task: ${error.message}`);
    return data as MarketplaceTask;
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
        completedAt: new Date().toISOString(),
        actualHours: request.actualHours,
        completedBy: userId,
        ...(request.notes && { completionNotes: request.notes }),
      })
      .eq('id', request.taskId)
      .select()
      .single();

    if (error) throw new Error(`Failed to complete task: ${error.message}`);
    return data as MarketplaceTask;
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

    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
    return data as MarketplaceTask[];
  }

  /**
   * Get task statistics
   */
  async getDailyStats() {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .rpc('get_marketplace_daily_stats');

    if (error) throw new Error(`Failed to fetch stats: ${error.message}`);
    return data;
  }
}
