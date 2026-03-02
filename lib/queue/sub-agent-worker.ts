/**
 * Worker Process for Sub-Agent Task Execution
 * Processes BullMQ jobs and calls SubAgentOrchestrator methods
 */

import { Worker, Job } from 'bullmq';
import type { Redis } from 'ioredis';
import { getRedisClient } from '@lib/redis-client';
import { getSubAgentOrchestrator } from '@lib/marketplace-orchestration/services/sub-agent-orchestrator';
import { logger } from '@lib/logger';

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
      logger.info({ jobId: job.id }, 'Processing sub-agent job');

      try {
        job.updateProgress(10);

        const { subtask_id, task_id, action, user_id, notes } = job.data;
        const orchestrator = getSubAgentOrchestrator();

        logger.info(
          { action, subtaskId: subtask_id },
          'Sub-agent action'
        );
        job.updateProgress(30);

        let result: any;

        switch (action) {
          case 'execute_subtask':
            result = await orchestrator.executeSubtask(subtask_id);
            logger.info({ subtaskId: subtask_id }, 'Subtask executed');
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
            logger.info({ subtaskId: subtask_id, userId: user_id }, 'Checkpoint approved');
            break;

          case 'reject_checkpoint':
            if (!user_id) {
              throw new Error('user_id required for reject_checkpoint action');
            }
            result = await orchestrator.rejectCheckpoint(subtask_id, user_id);
            logger.info({ subtaskId: subtask_id, userId: user_id }, 'Checkpoint rejected');
            break;

          default:
            throw new Error(`Unknown action: ${action}`);
        }

        job.updateProgress(90);

        logger.info({ jobId: job.id }, 'Job completed');
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

        logger.error({ jobId: job.id, error: errorMessage }, 'Job failed');
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
    logger.info({ jobId: job.id }, 'Sub-agent job completed');
  });

  workerInstance.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Sub-agent job failed');
  });

  workerInstance.on('error', (err) => {
    logger.error({ error: err.message }, 'Sub-agent worker error');
  });

  workerInstance.on('paused', () => {
    logger.warn('Sub-agent worker paused');
  });

  logger.info('Sub-agent worker initialized and running');

  return workerInstance;
}

/**
 * Gracefully shutdown the worker
 * Waits for in-flight jobs to complete (max 30s)
 */
export async function shutdownSubAgentWorker(): Promise<void> {
  if (workerInstance) {
    logger.info('Shutting down sub-agent worker gracefully');

    try {
      await workerInstance.close();
      logger.info('Sub-agent worker shut down gracefully');
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Worker shutdown error'
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
