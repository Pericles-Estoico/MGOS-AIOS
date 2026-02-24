/**
 * Worker Initialization
 * Starts the Phase 1 worker when the application boots
 * Should be imported in app/layout.tsx or similar
 */

import { initPhase1Worker, shutdownPhase1Worker } from '@lib/queue/phase1-worker';
import { initQueueEventListeners, closeQueueEventListeners } from '@lib/queue/queue-events';

let workerInitialized = false;

/**
 * Initialize worker and event listeners
 * Safe to call multiple times (idempotent)
 */
export async function initializeQueueSystem(): Promise<void> {
  if (workerInitialized) {
    return;
  }

  try {
    console.log('🚀 Initializing queue system...');

    // Initialize worker
    await initPhase1Worker();

    // Initialize event listeners
    await initQueueEventListeners();

    workerInitialized = true;
    console.log('✅ Queue system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize queue system:', error);
    // Don't throw - queue is optional for dev mode
    // but log so we know it's not working
  }
}

/**
 * Graceful shutdown of worker
 * Call this on app termination
 */
export async function shutdownQueueSystem(): Promise<void> {
  if (!workerInitialized) {
    return;
  }

  try {
    console.log('🛑 Shutting down queue system...');

    await shutdownPhase1Worker();
    await closeQueueEventListeners();

    workerInitialized = false;
    console.log('✅ Queue system shut down');
  } catch (error) {
    console.error('⚠️ Error during queue system shutdown:', error);
  }
}

/**
 * Check if worker is initialized
 */
export function isQueueSystemReady(): boolean {
  return workerInitialized;
}
