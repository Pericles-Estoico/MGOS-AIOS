/**
 * Event System for Phase 1 Queue
 * Emits job status change events and handles webhooks
 */

import { EventEmitter } from 'events';
import { getPhase1QueueEvents } from '@/lib/queue/phase1-queue';

/**
 * Job lifecycle event payload type (more flexible than strict types)
 */
export interface JobEventCallback {
  (payload: JobEventPayload): Promise<void> | void;
}

/**
 * Job lifecycle events
 */
export enum JobEvent {
  ENQUEUED = 'job:enqueued',
  ACTIVE = 'job:active',
  PROGRESS = 'job:progress',
  COMPLETED = 'job:completed',
  FAILED = 'job:failed',
  RETRYING = 'job:retrying',
}

/**
 * Event payload types
 */
export interface JobEventPayload {
  jobId: string;
  timestamp: Date;
  planId?: string;
  details?: Record<string, unknown>;
}

/**
 * Singleton event emitter
 */
const eventEmitter = new EventEmitter();

/**
 * Maximum event listeners to prevent memory leaks
 */
eventEmitter.setMaxListeners(100);

/**
 * Subscribe to job events
 */
export function onJobEvent(event: JobEvent, callback: JobEventCallback): void {
  eventEmitter.on(event, callback);
}

/**
 * Unsubscribe from job events
 */
export function offJobEvent(event: JobEvent, callback: JobEventCallback): void {
  eventEmitter.off(event, callback);
}

/**
 * Emit a job event
 */
export function emitJobEvent(event: JobEvent, payload: JobEventPayload): void {
  console.log(`📡 Event emitted: ${event} - Job ${payload.jobId}`);
  eventEmitter.emit(event, payload);
}

/**
 * Initialize queue event listeners
 * Bridges BullMQ queue events to our event emitter
 */
export async function initQueueEventListeners(): Promise<void> {
  const queueEvents = getPhase1QueueEvents();

  // Job enqueued
  queueEvents.on('enqueued', (eventData: unknown) => {
    const event = eventData as Record<string, unknown>;
    const jobId = String(event.jobId ?? '');
    const data = event.data as Record<string, unknown> | undefined;

    emitJobEvent(JobEvent.ENQUEUED, {
      jobId,
      timestamp: new Date(),
      planId: data?.planId as string | undefined,
      details: { channels: Array.isArray(data?.channels) ? data.channels.length : 0 },
    });
  });

  // Job started processing
  queueEvents.on('active', (eventData: unknown) => {
    const event = eventData as Record<string, unknown>;
    const jobId = String(event.jobId ?? '');
    const prev = String(event.prev ?? '');

    emitJobEvent(JobEvent.ACTIVE, {
      jobId,
      timestamp: new Date(),
      details: { previousState: prev },
    });
  });

  // Job progress update
  queueEvents.on('progress', (eventData: unknown) => {
    const event = eventData as Record<string, unknown>;
    const jobId = String(event.jobId ?? '');
    const data = event.data;

    emitJobEvent(JobEvent.PROGRESS, {
      jobId,
      timestamp: new Date(),
      details: { progress: data },
    });
  });

  // Job completed successfully
  queueEvents.on('completed', (eventData: unknown) => {
    const event = eventData as Record<string, unknown>;
    const jobId = String(event.jobId ?? '');
    const returnvalue = event.returnvalue;

    emitJobEvent(JobEvent.COMPLETED, {
      jobId,
      timestamp: new Date(),
      details: { result: returnvalue },
    });

    // Trigger webhook notification
    notifyCompletion(jobId, returnvalue).catch(() => {
      console.error(`Failed to notify completion for job ${jobId}`);
    });
  });

  // Job failed
  queueEvents.on('failed', (eventData: unknown) => {
    const event = eventData as Record<string, unknown>;
    const jobId = String(event.jobId ?? '');
    const failedReason = String(event.failedReason ?? '');

    emitJobEvent(JobEvent.FAILED, {
      jobId,
      timestamp: new Date(),
      details: { error: failedReason },
    });

    // Trigger webhook notification
    notifyFailure(jobId, failedReason).catch(() => {
      console.error(`Failed to notify failure for job ${jobId}`);
    });
  });

  // Job retrying
  queueEvents.on('retry', (eventData: unknown) => {
    const event = eventData as Record<string, unknown>;
    const jobId = String(event.jobId ?? '');
    const attemptsMade = event.attemptsMade;

    emitJobEvent(JobEvent.RETRYING, {
      jobId,
      timestamp: new Date(),
      details: { attemptsMade },
    });
  });

  console.log('✅ Queue event listeners initialized');
}

/**
 * Close queue event listeners
 */
export async function closeQueueEventListeners(): Promise<void> {
  const queueEvents = getPhase1QueueEvents();
  await queueEvents.close();
  console.log('✅ Queue event listeners closed');
}

/**
 * Webhook notification on job completion
 * Extensible for integrations (Slack, email, etc.)
 */
async function notifyCompletion(jobId: string, result: unknown): Promise<void> {
  const webhookUrl = process.env.JOB_COMPLETION_WEBHOOK;

  if (!webhookUrl) {
    return; // No webhook configured
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'job:completed',
        jobId,
        result,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(`Webhook returned ${response.status} for job ${jobId}`);
    }
  } catch (error) {
    console.error(`Webhook notification failed for job ${jobId}:`, error);
  }
}

/**
 * Webhook notification on job failure
 * Extensible for integrations (Slack, email, etc.)
 */
async function notifyFailure(jobId: string, error: string): Promise<void> {
  const webhookUrl = process.env.JOB_FAILURE_WEBHOOK;

  if (!webhookUrl) {
    return; // No webhook configured
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'job:failed',
        jobId,
        error,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(`Webhook returned ${response.status} for job ${jobId}`);
    }
  } catch (error) {
    console.error(`Webhook notification failed for job ${jobId}:`, error);
  }
}
