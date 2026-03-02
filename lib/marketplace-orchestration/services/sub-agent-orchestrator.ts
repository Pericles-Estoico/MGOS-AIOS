/**
 * Sub-Agent Orchestrator Service
 * Manages autonomous sub-agent task decomposition and execution
 *
 * Workflow:
 * 1. decomposeTask(taskId) - Analyze approved task and create subtasks
 * 2. executeSubtask(subtaskId) - Execute subtask with agent call
 * 3. requestCheckpoint(subtaskId, data) - Pause and request human approval
 * 4. approveCheckpoint(subtaskId, userId) - Approve and resume execution
 */

import { createSupabaseServerClient } from '@lib/supabase';
import type {
  SubTask,
  SubTaskStatus,
  SubTaskRequest,
  SubTaskCheckpointRequest,
  SubTaskApprovalRequest,
} from '../types';

/**
 * Sub-agent configuration defining specialization and capabilities
 */
const SUB_AGENTS = {
  'marketplace-analyzer': {
    name: 'Marketplace Analyzer (Alex)',
    specialization: 'analysis',
    description: 'Analyzes marketplace context, competitors, opportunities',
  },
  'content-generator': {
    name: 'Content Generator (Marina)',
    specialization: 'content_generation',
    description: 'Generates optimized titles, descriptions, tags per channel',
  },
  'task-delegator': {
    name: 'Task Delegator (Jordan)',
    specialization: 'delegation',
    description: 'Creates and delegates specialized sub-subtasks',
  },
};

export class SubAgentOrchestrator {
  constructor(private accessToken?: string) {}

  /**
   * Decompose an approved task into subtasks
   * Called after task is approved by human
   *
   * Workflow:
   * - Fetch approved task
   * - Determine decomposition strategy based on marketplace/content
   * - Create subtasks in sequence (1→2→3)
   * - Queue first subtask for execution
   */
  async decomposeTask(taskId: string): Promise<string[]> {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    // 1. Fetch the approved task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('admin_approved', true)
      .single();

    if (taskError || !task) {
      throw new Error(`Task not found or not approved: ${taskError?.message}`);
    }

    // 2. Create decomposition plan
    // All tasks: Analysis → Content Generation → (optional) Delegation
    const subtasks: SubTaskRequest[] = [
      {
        parent_task_id: taskId,
        sub_agent_id: 'marketplace-analyzer',
        type: 'analysis',
        title: `Market Analysis for ${task.title}`,
        description: `Analyze marketplace context and opportunities for: ${task.description}`,
        order_index: 0,
      },
      {
        parent_task_id: taskId,
        sub_agent_id: 'content-generator',
        type: 'content_generation',
        title: `Generate Optimized Content for ${task.title}`,
        description: `Create channel-specific titles, descriptions, and tags based on analysis`,
        order_index: 1,
      },
    ];

    // Optional: If task involves complex delegations, add third subtask
    if (task.channel && ['mercadolivre', 'shopee'].includes(task.channel)) {
      subtasks.push({
        parent_task_id: taskId,
        sub_agent_id: 'task-delegator',
        type: 'delegation',
        title: `Delegate Sub-Tasks for ${task.title}`,
        description: `Break down complex marketplace changes into executable sub-tasks`,
        order_index: 2,
      });
    }

    // 3. Insert subtasks and collect IDs
    const subtaskIds: string[] = [];

    for (const subtask of subtasks) {
      const { data: created, error: insertError } = await supabase
        .from('marketplace_subtasks')
        .insert([subtask])
        .select()
        .single();

      if (insertError || !created) {
        console.error(`Failed to create subtask: ${insertError?.message}`);
        throw new Error(`Failed to create subtask: ${insertError?.message}`);
      }

      subtaskIds.push(created.id);
      console.log(`✅ Created subtask: ${created.id} (${subtask.type})`);
    }

    return subtaskIds;
  }

  /**
   * Execute a single subtask
   * Called by the BullMQ worker
   *
   * Executes the subtask logic and may request checkpoint
   */
  async executeSubtask(subtaskId: string): Promise<SubTask> {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    // 1. Fetch subtask
    const { data: subtask, error: fetchError } = await supabase
      .from('marketplace_subtasks')
      .select('*')
      .eq('id', subtaskId)
      .single();

    if (fetchError || !subtask) {
      throw new Error(`Subtask not found: ${fetchError?.message}`);
    }

    // 2. Update status to in_progress
    await this.updateSubtaskStatus(subtaskId, 'in_progress');

    // 3. Execute subtask based on type
    let result: any = {};
    try {
      switch (subtask.type) {
        case 'analysis':
          result = await this.executeAnalysis(subtask);
          break;
        case 'content_generation':
          result = await this.executeContentGeneration(subtask);
          break;
        case 'delegation':
          result = await this.executeDelegation(subtask);
          break;
      }
    } catch (error) {
      console.error(`Subtask execution failed: ${error}`);
      await this.updateSubtaskStatus(subtaskId, 'failed');
      throw error;
    }

    // 4. Request checkpoint (pause for human review)
    await this.requestCheckpoint(subtaskId, result);

    // 5. Return updated subtask
    const { data: updated } = await supabase
      .from('marketplace_subtasks')
      .select('*')
      .eq('id', subtaskId)
      .single();

    return updated as SubTask;
  }

  /**
   * Execute analysis subtask
   * Analyzes marketplace context and opportunities
   */
  private async executeAnalysis(subtask: SubTask): Promise<any> {
    console.log(`🔍 Executing analysis subtask: ${subtask.id}`);

    // In production, call actual AI agent
    // For now, mock analysis result
    return {
      marketplace: 'amazon', // Would be determined from parent task
      competitors: ['competitor1', 'competitor2'],
      opportunities: [
        'Improve ranking keywords',
        'Enhance product images',
        'Update pricing strategy',
      ],
      recommendations: [
        'Focus on keyword optimization',
        'Review competitor pricing',
      ],
      analysis_date: new Date().toISOString(),
    };
  }

  /**
   * Execute content generation subtask
   * Generates optimized content for marketplace
   */
  private async executeContentGeneration(subtask: SubTask): Promise<any> {
    console.log(`📝 Executing content generation subtask: ${subtask.id}`);

    // In production, call actual AI agent
    // For now, mock content generation
    return {
      channels: {
        amazon: {
          title: 'Optimized product title for Amazon',
          description: 'Enhanced description optimized for Amazon ranking',
          tags: ['keyword1', 'keyword2', 'keyword3'],
        },
        shopee: {
          title: 'Título otimizado para Shopee',
          description: 'Descrição aprimorada otimizada para ranking Shopee',
          tags: ['palavra-chave1', 'palavra-chave2'],
        },
      },
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Execute delegation subtask
   * Creates sub-subtasks from complex changes
   */
  private async executeDelegation(subtask: SubTask): Promise<any> {
    console.log(`🎯 Executing delegation subtask: ${subtask.id}`);

    // In production, call actual AI agent
    // For now, mock delegation
    return {
      sub_subtasks: [
        {
          title: 'Update price on Amazon',
          estimated_hours: 0.5,
          priority: 'high',
        },
        {
          title: 'Review competitor pricing',
          estimated_hours: 1,
          priority: 'medium',
        },
      ],
      delegation_date: new Date().toISOString(),
    };
  }

  /**
   * Request human checkpoint approval
   * Pauses execution and saves data for review
   */
  async requestCheckpoint(
    subtaskId: string,
    checkpointData: any
  ): Promise<void> {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    console.log(`⏸️  Requesting checkpoint for subtask: ${subtaskId}`);

    const { error } = await supabase
      .from('marketplace_subtasks')
      .update({
        status: 'awaiting_checkpoint' as SubTaskStatus,
        checkpoint_data: checkpointData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subtaskId);

    if (error) {
      throw new Error(`Failed to request checkpoint: ${error.message}`);
    }

    console.log(`✅ Checkpoint requested and awaiting human approval`);
  }

  /**
   * Approve checkpoint and proceed to next subtask
   * Called from API when human approves
   */
  async approveCheckpoint(
    subtaskId: string,
    userId: string,
    notes?: string
  ): Promise<SubTask> {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    console.log(`✅ Approving checkpoint for subtask: ${subtaskId}`);

    // 1. Update subtask status to completed
    const { data: updated, error: updateError } = await supabase
      .from('marketplace_subtasks')
      .update({
        status: 'completed' as SubTaskStatus,
        checkpoint_approved_by: userId,
        checkpoint_approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subtaskId)
      .select()
      .single();

    if (updateError || !updated) {
      throw new Error(`Failed to approve checkpoint: ${updateError?.message}`);
    }

    // 2. Get next subtask (order_index + 1)
    const { data: nextSubtask } = await supabase
      .from('marketplace_subtasks')
      .select('*')
      .eq('parent_task_id', updated.parent_task_id)
      .eq('status', 'pending')
      .order('order_index', { ascending: true })
      .limit(1)
      .single();

    // 3. If next subtask exists, queue it for execution
    if (nextSubtask) {
      console.log(`🔄 Queueing next subtask: ${nextSubtask.id}`);
      // This will be called by the API to enqueue the next job
      // Implementation happens in the API route
    } else {
      console.log(`✅ All subtasks completed for parent task`);
    }

    return updated as SubTask;
  }

  /**
   * Reject checkpoint and reset subtask
   * Allows human to request changes
   */
  async rejectCheckpoint(subtaskId: string, userId: string): Promise<SubTask> {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    console.log(`❌ Rejecting checkpoint for subtask: ${subtaskId}`);

    const { data: updated, error } = await supabase
      .from('marketplace_subtasks')
      .update({
        status: 'pending' as SubTaskStatus,
        checkpoint_data: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subtaskId)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`Failed to reject checkpoint: ${error?.message}`);
    }

    return updated as SubTask;
  }

  /**
   * Get all subtasks for a parent task with their status
   */
  async getSubtasksStatus(parentTaskId: string): Promise<SubTask[]> {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('marketplace_subtasks')
      .select('*')
      .eq('parent_task_id', parentTaskId)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch subtasks: ${error.message}`);
    }

    return (data || []) as SubTask[];
  }

  /**
   * Get subtask details
   */
  async getSubtask(subtaskId: string): Promise<SubTask> {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('marketplace_subtasks')
      .select('*')
      .eq('id', subtaskId)
      .single();

    if (error || !data) {
      throw new Error(`Subtask not found: ${error?.message}`);
    }

    return data as SubTask;
  }

  /**
   * Get consolidated results from all completed subtasks
   */
  async getConsolidatedResults(parentTaskId: string): Promise<any> {
    const subtasks = await this.getSubtasksStatus(parentTaskId);

    const results: Record<string, any> = {
      parent_task_id: parentTaskId,
      completed_at: new Date().toISOString(),
      subtasks: subtasks.map((st) => ({
        id: st.id,
        type: st.type,
        status: st.status,
        result_data: st.result_data,
        checkpoint_data: st.checkpoint_data,
      })),
    };

    // Consolidate by type
    const byType: Record<string, any[]> = {};
    subtasks.forEach((st) => {
      if (!byType[st.type]) {
        byType[st.type] = [];
      }
      if (st.result_data) {
        byType[st.type].push(st.result_data);
      }
    });

    results.consolidated_by_type = byType;
    return results;
  }

  /**
   * Internal helper: Update subtask status
   */
  private async updateSubtaskStatus(
    subtaskId: string,
    status: SubTaskStatus
  ): Promise<void> {
    const supabase = createSupabaseServerClient(this.accessToken);
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('marketplace_subtasks')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subtaskId);

    if (error) {
      throw new Error(`Failed to update subtask status: ${error.message}`);
    }
  }
}

/**
 * Singleton instance
 */
let orchestratorInstance: SubAgentOrchestrator | null = null;

export function getSubAgentOrchestrator(accessToken?: string) {
  if (!orchestratorInstance) {
    orchestratorInstance = new SubAgentOrchestrator(accessToken);
  }
  return orchestratorInstance;
}
