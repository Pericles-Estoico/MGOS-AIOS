/**
 * Task Manager - Gerencia o ciclo de vida das tarefas de marketplace
 * Tabela: marketplace_tasks
 */

import { createSupabaseServerClient } from '@lib/supabase';
import type {
  MarketplaceTask,
  TaskStatus,
  TaskApprovalRequest,
  TaskAssignmentRequest,
  TaskCompletionRequest,
} from './types';

export class TaskManager {
  constructor(private accessToken?: string) {}

  private get supabase() {
    const client = createSupabaseServerClient(this.accessToken);
    if (!client) throw new Error('Supabase não configurado. Verifique as variáveis de ambiente.');
    return client;
  }

  /**
   * Cria tarefa gerada por agente
   */
  async createTask(task: Omit<MarketplaceTask, 'id' | 'createdAt'>) {
    const { data, error } = await this.supabase
      .from('marketplace_tasks')
      .insert([{
        ...task,
        created_at: new Date().toISOString(),
        status: 'pending' as TaskStatus,
      }])
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar tarefa: ${error.message}`);
    return data as MarketplaceTask;
  }

  /**
   * Busca tarefas pendentes de aprovação humana
   */
  async getPendingApproval(limit = 50, offset = 0) {
    const { data, error, count } = await this.supabase
      .from('marketplace_tasks')
      .select('*', { count: 'exact' })
      .in('status', ['pending', 'awaiting_approval'])
      .eq('admin_approved', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Erro ao buscar tarefas pendentes: ${error.message}`);
    return { tasks: (data || []) as MarketplaceTask[], total: count || 0 };
  }

  /**
   * Aprova ou rejeita tarefas em batch — ação humana
   */
  async approveTasks(request: TaskApprovalRequest, userId: string) {
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

    const { data, error } = await this.supabase
      .from('marketplace_tasks')
      .update(updateData)
      .in('id', taskIds)
      .select();

    if (error) throw new Error(`Erro ao processar aprovação: ${error.message}`);
    return data as MarketplaceTask[];
  }

  /**
   * Atribui tarefa aprovada a um membro da equipe
   */
  async assignTask(request: TaskAssignmentRequest, assignedBy: string) {
    const { data, error } = await this.supabase
      .from('marketplace_tasks')
      .update({
        assigned_to: request.assignedTo,
        assigned_by: assignedBy,
        status: 'in_progress' as TaskStatus,
        started_at: new Date().toISOString(),
      })
      .eq('id', request.taskId)
      .eq('status', 'approved') // só atribui tarefas aprovadas
      .select()
      .single();

    if (error) throw new Error(`Erro ao atribuir tarefa: ${error.message}`);
    return data as MarketplaceTask;
  }

  /**
   * Marca tarefa como concluída
   */
  async completeTask(request: TaskCompletionRequest, userId: string) {
    const { data, error } = await this.supabase
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

    if (error) throw new Error(`Erro ao concluir tarefa: ${error.message}`);
    return data as MarketplaceTask;
  }

  /**
   * Busca tarefas por marketplace e status opcional
   */
  async getTasksByMarketplace(marketplace: string, status?: string) {
    let query = this.supabase
      .from('marketplace_tasks')
      .select('*')
      .eq('marketplace', marketplace);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar tarefas: ${error.message}`);
    return data as MarketplaceTask[];
  }

  /**
   * Estatísticas diárias por marketplace
   */
  async getDailyStats() {
    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const { data, error } = await this.supabase
      .from('marketplace_tasks')
      .select('marketplace, status, admin_approved, created_at')
      .gte('created_at', since.toISOString());

    if (error) throw new Error(`Erro ao buscar estatísticas: ${error.message}`);

    // Agrupa por marketplace
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
