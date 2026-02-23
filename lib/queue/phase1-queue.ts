/**
 * BullMQ Queue for Phase 1 Task Creation
 * Handles asynchronous job processing for marketplace analysis Phase 1 tasks
 */

import { Queue, QueueEvents } from 'bullmq';
import { z } from 'zod';
import type { Redis } from 'ioredis';
import { getRedisClient } from '@/lib/redis-client';

/**
 * Job payload schema with Zod validation
 */
export const Phase1JobSchema = z.object({
  planId: z.string().uuid('Invalid plan ID'),
  channels: z.array(z.string()).min(1, 'At least one channel required'),
  opportunities: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      phase: z.enum(['1', '2', '3']),
      description: z.string().optional(),
    })
  ),
  metadata: z.object({
    createdBy: z.string(),
    approvedAt: z.date().optional(),
    reason: z.string().optional(),
  }),
});

export type Phase1Job = z.infer<typeof Phase1JobSchema>;

/**
 * Singleton queue instance
 */
let queueInstance: Queue<Phase1Job> | null = null;

/**
 * Get or create Phase 1 job queue
 */
export function getPhase1Queue(): Queue<Phase1Job> {
  if (queueInstance) {
    return queueInstance;
  }

  const redisClient = getRedisClient();

  queueInstance = new Queue<Phase1Job>('phase1-tasks', {
    connection: redisClient as unknown as Redis,
    defaultJobOptions: {
      /**
       * Retry configuration: exponential backoff (1s → 5s → 30s)
       * Max 3 retries with exponential delays
       */
      attempts: 4, // Initial attempt + 3 retries
      backoff: {
        type: 'exponential',
        delay: 1000, // Start at 1 second
      },
      /**
       * Job timeout: 10 seconds per job
       */
      timeout: parseInt(process.env.JOB_TIMEOUT_MS || '10000'),
      /**
       * Remove completed jobs after 1 hour to save Redis memory
       */
      removeOnComplete: {
        age: 3600, // seconds
      },
      /**
       * Keep failed jobs in DLQ for debugging (up to 30 days)
       */
      removeOnFail: false,
    },
  });

  // Create dead-letter queue for failed jobs
  getPhase1DLQ();

  return queueInstance;
}

/**
 * Get or create Dead Letter Queue for failed jobs
 */
export function getPhase1DLQ(): Queue<Phase1Job> {
  const redisClient = getRedisClient();
  return new Queue<Phase1Job>('phase1-tasks:dlq', {
    connection: redisClient as unknown as Redis,
  });
}

/**
 * Enqueue a new Phase 1 job
 * @param job Job payload (validated with Zod)
 * @returns Job ID for polling/tracking
 */
export async function enqueuePhase1Job(payload: unknown): Promise<string> {
  // Validate job payload
  const validatedJob = Phase1JobSchema.parse(payload);

  const queue = getPhase1Queue();

  // Enqueue job with correlation ID
  const job = await queue.add(`phase1-${validatedJob.planId}`, validatedJob, {
    jobId: `phase1-${validatedJob.planId}-${Date.now()}`,
  });

  console.log(`✅ Job enqueued: ${job.id} for plan ${validatedJob.planId}`);

  return job.id;
}

/**
 * Get job status and progress
 */
export async function getJobStatus(jobId: string) {
  const queue = getPhase1Queue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    status: await job.getState(),
    progress: job.progress(),
    data: job.data,
    result: job.returnvalue,
    error: job.failedReason,
    attempts: job.attemptsMade,
    maxAttempts: job.opts.attempts,
    createdAt: job.timestamp ? new Date(job.timestamp) : null,
  };
}

/**
 * Clean up queue instance (graceful shutdown)
 */
export async function closePhase1Queue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
    console.log('✅ Phase 1 queue closed');
  }
}

/**
 * Get queue events for monitoring
 */
export function getPhase1QueueEvents(): QueueEvents {
  const redisClient = getRedisClient();
  return new QueueEvents('phase1-tasks', {
    connection: redisClient as unknown as Redis,
  });
}
