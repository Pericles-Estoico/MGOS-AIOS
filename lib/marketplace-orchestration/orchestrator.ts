/**
 * Marketplace Master Orchestrator
 * Central coordinator for all marketplace sub-agents
 */

import { TaskManager } from './task-manager';
import type { Marketplace, MarketplaceTask, TaskDailyStats } from './types';

const MARKETPLACE_AGENTS = [
  'marketplace-amazon',
  'marketplace-shopee',
  'marketplace-mercadolivre',
  'marketplace-shein',
  'marketplace-tiktokshop',
  'marketplace-kaway',
] as const;

export class MarketplaceOrchestrator {
  private taskManager: TaskManager;
  private dailyScheduleTime: string = '08:00';

  constructor(accessToken?: string) {
    this.taskManager = new TaskManager(accessToken);
  }

  /**
   * Initialize daily task generation for all marketplaces
   */
  async initializeDailyTasks() {
    console.log(`[Orchestrator] Initializing daily tasks at ${new Date().toISOString()}`);

    const tasks: MarketplaceTask[] = [];

    for (const agent of MARKETPLACE_AGENTS) {
      try {
        // In production, this would call each sub-agent's API
        // For now, log the orchestration
        console.log(`[Orchestrator] Collecting tasks from ${agent}`);
      } catch (error) {
        console.error(`[Orchestrator] Error collecting from ${agent}:`, error);
      }
    }

    return tasks;
  }

  /**
   * Monitor sub-agent task creation and batch for approval
   */
  async batchTasksForApproval(limit = 50) {
    console.log(`[Orchestrator] Batching tasks for approval...`);

    try {
      const { tasks, total } = await this.taskManager.getPendingApproval(limit);

      console.log(`[Orchestrator] Found ${total} tasks awaiting approval`);

      // Group by marketplace for analytics
      const grouped = this.groupByMarketplace(tasks);

      return {
        tasks,
        grouped,
        total,
        readyForApproval: tasks.length > 0,
      };
    } catch (error) {
      console.error('[Orchestrator] Error batching tasks:', error);
      throw error;
    }
  }

  /**
   * Get current orchestration status
   */
  async getStatus() {
    try {
      const stats = await this.taskManager.getDailyStats();
      return {
        timestamp: new Date().toISOString(),
        agents: MARKETPLACE_AGENTS,
        stats,
      };
    } catch (error) {
      console.error('[Orchestrator] Error getting status:', error);
      throw error;
    }
  }

  /**
   * Group tasks by marketplace
   */
  private groupByMarketplace(tasks: MarketplaceTask[]) {
    const grouped: Record<Marketplace, MarketplaceTask[]> = {
      amazon: [],
      shopee: [],
      mercadolivre: [],
      shein: [],
      tiktokshop: [],
      kaway: [],
    };

    tasks.forEach((task) => {
      if (grouped[task.marketplace]) {
        grouped[task.marketplace].push(task);
      }
    });

    return grouped;
  }

  /**
   * Send notification to user about tasks needing approval
   */
  async notifyApprovalNeeded(tasks: MarketplaceTask[]) {
    console.log(`[Orchestrator] Notifying user about ${tasks.length} tasks needing approval`);
    // In production, send email/Slack notification
    return {
      notified: true,
      timestamp: new Date().toISOString(),
      taskCount: tasks.length,
    };
  }

  /**
   * Subscribe to task creation events from sub-agents
   */
  async subscribeToTaskEvents() {
    console.log('[Orchestrator] Subscribing to task creation events...');
    // In production, set up real-time subscriptions
    return {
      subscribed: true,
      agents: MARKETPLACE_AGENTS,
    };
  }
}

/**
 * Singleton instance for global use
 */
export function getOrchestrator(accessToken?: string) {
  return new MarketplaceOrchestrator(accessToken);
}
