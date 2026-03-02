/**
 * Next.js Instrumentation (App Initialization)
 * Runs during app startup to initialize critical services
 *
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { logger } from '@lib/logger';
import { initSubAgentWorker } from '@lib/queue/sub-agent-worker';

/**
 * Register function - runs on server startup (Node.js only)
 */
export async function register() {
  logger.info('🚀 Starting MGOS-AIOS app initialization...');

  // Initialize sub-agent worker
  try {
    logger.info('Initializing sub-agent worker on startup...');
    await initSubAgentWorker();
    logger.info('✅ Sub-agent worker initialized on startup');
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      '❌ Failed to initialize sub-agent worker on startup'
    );
    // Don't throw - allow app to start even if worker fails
    // Workers can be manually initialized via /api/queue/init
  }

  logger.info('✅ App initialization complete');
}
