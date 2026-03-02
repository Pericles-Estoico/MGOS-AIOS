/**
 * BullMQ Queue for Sub-Agent Task Execution
 * Handles asynchronous job processing for autonomous sub-agents
 */

import { Queue, QueueEvents } from 'bullmq';
import type { Redis } from 'ioredis';
import { getRedisClient } from '@lib/redis-client';

/**
 * Job payload type (manual validation - no zod dependency needed)
 */
export interface SubAgentJob {
    subtask_id: string;
    task_id: string;
    action: 'execute_subtask' | 'approve_checkpoint' | 'reject_checkpoint';
    user_id?: string;
    notes?: string;
}

/**
 * Validate job payload manually
 */
function validateSubAgentJob(payload: unknown): SubAgentJob {
    if (!payload || typeof payload !== 'object') {
          throw new Error('Invalid job payload: must be an object');
    }
    const p = payload as Record<string, unknown>;
    if (!p.subtask_id || typeof p.subtask_id !== 'string') throw new Error('Invalid subtask_id');
    if (!p.task_id || typeof p.task_id !== 'string') throw new Error('Invalid task_id');
    const validActions = ['execute_subtask', 'approve_checkpoint', 'reject_checkpoint'];
    if (!p.action || !validActions.includes(p.action as string)) throw new Error('Invalid action');
    return p as unknown as SubAgentJob;
}

let queueInstance: Queue<SubAgentJob> | null = null;

export function getSubAgentQueue(): Queue<SubAgentJob> {
    if (queueInstance) {
          return queueInstance;
    }
    const redisClient = getRedisClient();
    queueInstance = new Queue<SubAgentJob>('sub-agent-tasks', {
          connection: redisClient as unknown as Redis,
          defaultJobOptions: {
                  attempts: 3,
                  backoff: {
                            type: 'exponential',
                            delay: 1000,
                  },
                  removeOnComplete: {
                            age: 3600,
                  },
                  removeOnFail: false,
          },
    } as any) as Queue<SubAgentJob>;

  getSubAgentDLQ();
    return queueInstance!;
}

export function getSubAgentDLQ(): Queue<SubAgentJob> {
    const redisClient = getRedisClient();
    return new Queue<SubAgentJob>('sub-agent-tasks:dlq', {
          connection: redisClient as unknown as Redis,
    });
}

export async function enqueueSubAgentJob(payload: unknown): Promise<string> {
    const validatedJob = validateSubAgentJob(payload);
    const queue = getSubAgentQueue();

  const job = await queue.add(
        `subagent-${validatedJob.action}-${validatedJob.subtask_id}`,
        validatedJob,
    {
            jobId: `subagent-${validatedJob.subtask_id}-${Date.now()}`,
    }
      );

  return job.id!;
}
