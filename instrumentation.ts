/**
 * Next.js Instrumentation (App Initialization)
 * Runs during app startup to initialize critical services
 *
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { initSubAgentWorker } from '@lib/queue/sub-agent-worker';

/**
 * Register function - runs on server startup (Node.js only)
 */
export async function register() {
  console.log('🚀 Starting MGOS-AIOS app initialization...');

  // Initialize sub-agent worker
  try {
    console.log('Initializing sub-agent worker on startup...');
    await initSubAgentWorker();
    console.log('✅ Sub-agent worker initialized on startup');
  } catch (error) {
    console.error(
      '❌ Failed to initialize sub-agent worker on startup',
      error instanceof Error ? error.message : String(error)
    );
    // Don't throw - allow app to start even if worker fails
    // Workers can be manually initialized via /api/queue/init
  }

  console.log('✅ App initialization complete');
}
