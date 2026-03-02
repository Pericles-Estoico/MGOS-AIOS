/**
 * BullMQ Queue for Sub-Agent Task Execution
 * Handles asynchronous job processing for autonomous sub-agents
 */

import { Queue, QueueEvents } from 'bullmq';
import { z } from 'zod';
import type { Redis } from 'ioredis';
import { getRedisClient } from '@lib/redis-client';

/**
 * Job payload schema with Zod validation
 */
export const SubAgentJobSchema = z.object({
  subtask_id: z.string().uuid('Invalid subtask ID'),
  task_id: z.string().uuid('Invalid task ID'),
  action: z.enum(['execute_subtask', 'approve_checkpoint', 'reject_checkpoint']),
  user_id: z.string().optional(),
  notes: z.string().optional(),
});

export type SubAgentJob = z.infer<typeof SubAgentJobSchema>;

/**
 * Singleton queue instance
 */
let queueInstance: Queue<SubAgentJob> | null = null;

/**
 * Get or create sub-agent job queue
 */
export function getSubAgentQueue(): Queue<SubAgentJob> {
  if (queueInstance) {
    return queueInstance;
  }

  const redisClient = getRedisClient();

  queueInstance = new Queue<SubAgentJob>('sub-agent-tasks', {
    connection: redisClient as unknown as Redis,
    defaultJobOptions: {
      /**
       * Retry configuration: exponential backoff (1s → 5s → 30s)
       * Max 2 retries for sub-agent tasks
       */
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      /**
       * Remove completed jobs after 1 hour
       */
      removeOnComplete: {
        age: 3600,
      },
      /**
       * Keep failed jobs in DLQ for debugging
       */
      removeOnFail: false,
    },
  } as any) as Queue<SubAgentJob>;

  // Create dead-letter queue
  getSubAgentDLQ();

  return queueInstance!;
}

/**
 * Get or create Dead Letter Queue for failed jobs
 */
export function getSubAgentDLQ(): Queue<SubAgentJob> {
  const redisClient = getRedisClient();
  return new Queue<SubAgentJob>('sub-agent-tasks:dlq', {
    connection: redisClient as unknown as Redis,
  });
}

/**
 * Enqueue a new sub-agent job
 * @param job Job payload (validated with Zod)
 * @returns Job ID for polling/tracking
 */
export async function enqueueSubAgentJob(payload: unknown): Promise<string> {
  // Validate job payload
  const validatedJob = SubAgentJobSchema.parse(payload);

  const queue = getSubAgentQueue();

  // Enqueue job
  const job = await queue.add(
    `subagent-${validatedJob.action}-${validatedJob.subtask_id}`,
    validatedJob,
    {
      jobId: `subagent-${validatedJob.subtask_id}-${Date.now()}`,
    }
  );

  console.log(
    `✅ Sub-agent job enqueued: ${job.id} (action: ${validatedJob.action})`
  );

  return job.id || `subagent-${validatedJob.subtask_id}-${Date.now()}`;
}

/**
 * Get job status and progress
 */
export async function getSubAgentJobStatus(jobId: string) {
  const queue = getSubAgentQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  return {
    id: job.id || '',
    status: await job.getState(),
    progress: job.progress as any,
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
export async function closeSubAgentQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
    console.log('✅ Sub-agent queue closed');
  }
}

/**
 * Get queue events for monitoring
 */
export function getSubAgentQueueEvents(): QueueEvents {
  const redisClient = getRedisClient();
  return new QueueEvents('sub-agent-tasks', {
    connection: redisClient as unknown as Redis,
  });
}
