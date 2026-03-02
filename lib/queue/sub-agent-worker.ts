/**
 * Worker Process for Sub-Agent Task Execution
 * Processes BullMQ jobs and calls SubAgentOrchestrator methods
 */

import { Worker, Job } from 'bullmq';
import type { Redis } from 'ioredis';
import { getRedisClient } from '@lib/redis-client';
import { getSubAgentOrchestrator } from '@lib/marketplace-orchestration/services/sub-agent-orchestrator';

export interface SubAgentJob {
  subtask_id: string;
  task_id: string;
  action: 'execute_subtask' | 'approve_checkpoint' | 'reject_checkpoint';
  user_id?: string;
  notes?: string;
}

/**
 * Singleton worker instance
 */
let workerInstance: Worker<SubAgentJob> | null = null;

/**
 * Initialize and start the Sub-Agent worker
 * Should be called during app startup
 */
export async function initSubAgentWorker(): Promise<Worker<SubAgentJob>> {
  if (workerInstance) {
    return workerInstance;
  }

  const redisClient = getRedisClient();
  const jobTimeout = parseInt(process.env.JOB_TIMEOUT_MS || '30000'); // 30s for sub-agents

  const redisConnection = redisClient as unknown as Redis;

  workerInstance = new Worker<SubAgentJob>(
    'sub-agent-tasks',
    async (job: Job<SubAgentJob>) => {
      console.log(`🤖 Processing sub-agent job ${job.id}...`);

      try {
        job.updateProgress(10);

        const { subtask_id, task_id, action, user_id, notes } = job.data;
        const orchestrator = getSubAgentOrchestrator();

        console.log(
          `🎯 Sub-agent action: ${action} for subtask ${subtask_id}`
        );
        job.updateProgress(30);

        let result: any;

        switch (action) {
          case 'execute_subtask':
            result = await orchestrator.executeSubtask(subtask_id);
            console.log(`✅ Subtask executed: ${subtask_id}`);
            break;

          case 'approve_checkpoint':
            if (!user_id) {
              throw new Error('user_id required for approve_checkpoint action');
            }
            result = await orchestrator.approveCheckpoint(
              subtask_id,
              user_id,
              notes
            );
            console.log(`✅ Checkpoint approved: ${subtask_id}`);
            break;

          case 'reject_checkpoint':
            if (!user_id) {
              throw new Error('user_id required for reject_checkpoint action');
            }
            result = await orchestrator.rejectCheckpoint(subtask_id, user_id);
            console.log(`❌ Checkpoint rejected: ${subtask_id}`);
            break;

          default:
            throw new Error(`Unknown action: ${action}`);
        }

        job.updateProgress(90);

        console.log(`✅ Job ${job.id} completed`);
        job.updateProgress(100);

        return {
          success: true,
          action,
          subtask_id,
          result,
          completedAt: new Date().toISOString(),
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        console.error(`❌ Job ${job.id} failed: ${errorMessage}`);
        job.log(`Error: ${errorMessage}`);

        throw new Error(`Sub-agent task failed: ${errorMessage}`);
      }
    },
    {
      connection: redisConnection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
      lockDuration: jobTimeout,
      lockRenewTime: jobTimeout / 2,
      drainDelay: 30000,
    }
  );

  // Event handlers
  workerInstance.on('completed', (job) => {
    console.log(`✅ Sub-agent job completed: ${job.id}`);
  });

  workerInstance.on('failed', (job, err) => {
    console.error(`❌ Sub-agent job failed: ${job?.id} - ${err.message}`);
  });

  workerInstance.on('error', (err) => {
    console.error(`❌ Sub-agent worker error: ${err.message}`);
  });

  workerInstance.on('paused', () => {
    console.warn('⚠️ Sub-agent worker paused');
  });

  console.log('✅ Sub-agent worker initialized and running');

  return workerInstance;
}

/**
 * Gracefully shutdown the worker
 * Waits for in-flight jobs to complete (max 30s)
 */
export async function shutdownSubAgentWorker(): Promise<void> {
  if (workerInstance) {
    console.log('🛑 Shutting down sub-agent worker gracefully...');

    try {
      await workerInstance.close();
      console.log('✅ Sub-agent worker shut down gracefully');
    } catch (error) {
      console.error(
        `⚠️ Worker shutdown error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      workerInstance = null;
    }
  }
}

/**
 * Check if worker is running
 */
export function isSubAgentWorkerRunning(): boolean {
  return workerInstance !== null;
}

/**
 * Get worker instance for monitoring/debugging
 */
export function getSubAgentWorker(): Worker<SubAgentJob> | null {
  return workerInstance;
}
