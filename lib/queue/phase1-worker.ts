/**
 * Worker Process for Phase 1 Task Creation
 * Processes BullMQ jobs and calls createPhase1Tasks function
 */

import { Worker, Job } from 'bullmq';
import type { Redis } from 'ioredis';
import { getRedisClient } from '@/lib/redis-client';
import { Phase1Job } from '@/lib/queue/phase1-queue';
import { createPhase1Tasks } from '@/app/lib/ai/agent-loop';

/**
 * Singleton worker instance
 */
let workerInstance: Worker<Phase1Job> | null = null;

/**
 * Initialize and start the Phase 1 worker
 * Should be called during app startup
 */
export async function initPhase1Worker(): Promise<Worker<Phase1Job>> {
  if (workerInstance) {
    return workerInstance;
  }

  const redisClient = getRedisClient();
  const jobTimeout = parseInt(process.env.JOB_TIMEOUT_MS || '10000');

  const redisConnection = redisClient as unknown as Redis;

  workerInstance = new Worker<Phase1Job>(
    'phase1-tasks',
    async (job: Job<Phase1Job>) => {
      console.log(`🔄 Processing job ${job.id}...`);

      try {
        // Update job progress
        job.updateProgress(10);

        const { planId, channels, opportunities } = job.data;

        console.log(`📊 Creating Phase 1 tasks for plan ${planId}`);
        job.updateProgress(30);

        // Call existing createPhase1Tasks function
        // This function already handles database operations and returns created tasks
        const result = await createPhase1Tasks(planId, channels, opportunities);

        job.updateProgress(90);

        console.log(`✅ Job ${job.id} completed: ${result.tasksCreated} tasks created`);
        job.updateProgress(100);

        // Return result for polling
        return {
          success: true,
          tasksCreated: result.tasksCreated,
          taskIds: result.taskIds,
          completedAt: new Date().toISOString(),
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        console.error(`❌ Job ${job.id} failed: ${errorMessage}`);

        // Log error for debugging
        job.log(`Error: ${errorMessage}`);

        // Rethrow to trigger retry logic
        throw new Error(`Phase 1 task creation failed: ${errorMessage}`);
      }
    },
    {
      connection: redisConnection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '1'),
      lockDuration: jobTimeout,
      lockRenewTime: jobTimeout / 2,
      /**
       * Graceful shutdown: wait up to 30 seconds for jobs to complete
       */
      drainDelay: 30000,
    }
  );

  // Event handlers
  workerInstance.on('completed', (job) => {
    console.log(`✅ Job completed: ${job.id}`);
  });

  workerInstance.on('failed', (job, err) => {
    console.error(`❌ Job failed: ${job?.id} - ${err.message}`);
  });

  workerInstance.on('error', (err) => {
    console.error(`❌ Worker error: ${err.message}`);
  });

  workerInstance.on('paused', () => {
    console.warn('⚠️ Worker paused');
  });

  console.log('✅ Phase 1 worker initialized and running');

  return workerInstance;
}

/**
 * Gracefully shutdown the worker
 * Waits for in-flight jobs to complete (max 30s)
 */
export async function shutdownPhase1Worker(): Promise<void> {
  if (workerInstance) {
    console.log('🛑 Shutting down Phase 1 worker gracefully...');

    try {
      // close() waits for active jobs to complete
      // drainDelay in options controls the max wait time
      await workerInstance.close();
      console.log('✅ Phase 1 worker shut down gracefully');
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
export function isWorkerRunning(): boolean {
  return workerInstance !== null;
}

/**
 * Get worker instance for monitoring/debugging
 */
export function getPhase1Worker(): Worker<Phase1Job> | null {
  return workerInstance;
}
