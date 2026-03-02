/**
 * Initialize Sub-Agent Worker
 * GET /api/queue/init
 *
 * Starts the BullMQ worker for processing sub-agent jobs.
 * Should be called on app startup (via instrumentation.ts or cron job).
 */

import { NextRequest, NextResponse } from 'next/server';
import { initSubAgentWorker, isSubAgentWorkerRunning } from '@lib/queue/sub-agent-worker';
import { logger } from '@lib/logger';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check if already running
    if (isSubAgentWorkerRunning()) {
      logger.info('Sub-agent worker already running');
      return NextResponse.json(
        { status: 'running', message: 'Sub-agent worker is already running' },
        { status: 200 }
      );
    }

    // Initialize worker
    logger.info('Initializing sub-agent worker...');
    const worker = await initSubAgentWorker();

    logger.info(
      { workerId: worker.name, concurrency: worker.opts.concurrency },
      'Sub-agent worker initialized successfully'
    );

    return NextResponse.json(
      {
        status: 'initialized',
        message: 'Sub-agent worker initialized successfully',
        worker: {
          name: worker.name,
          concurrency: worker.opts.concurrency,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, 'Failed to initialize sub-agent worker');

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to initialize sub-agent worker',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/queue/init - Force reinitialize
 */
export async function POST(request: NextRequest) {
  try {
    logger.info('Force reinitializing sub-agent worker...');

    const worker = await initSubAgentWorker();

    return NextResponse.json(
      {
        status: 'reinitialized',
        message: 'Sub-agent worker reinitialized',
        worker: {
          name: worker.name,
          concurrency: worker.opts.concurrency,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, 'Failed to reinitialize sub-agent worker');

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to reinitialize sub-agent worker',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
