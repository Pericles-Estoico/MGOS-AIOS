/**
 * Instrumentation and Server Initialization
 * This file runs during Next.js server startup (before any requests)
 * Used to initialize long-running background processes like the BullMQ worker
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side and in production or when explicitly enabled
  if (typeof window !== 'undefined') {
    return; // Client-side, skip
  }

  // Check if worker initialization is enabled (can disable via env var for testing)
  const workerEnabled = process.env.ENABLE_QUEUE_WORKER !== 'false';

  if (!workerEnabled) {
    console.log('⏭️  Queue worker disabled (ENABLE_QUEUE_WORKER=false)');
    return;
  }

  try {
    console.log('🚀 [instrumented.ts] Initializing queue system on server startup...');

    // Dynamically import to avoid module resolution issues
    const { initializeQueueSystem } = await import('@lib/queue/worker-init');

    // Initialize the queue system (worker + event listeners)
    await initializeQueueSystem();

    console.log('✅ [instrumented.ts] Queue system initialized on server');

    // Register graceful shutdown handlers
    if (process.env.NODE_ENV === 'production') {
      const signals = ['SIGTERM', 'SIGINT'];
      signals.forEach(signal => {
        process.on(signal, async () => {
          console.log(`📢 Received ${signal}, shutting down queue system gracefully...`);
          try {
            const { shutdownQueueSystem } = await import('@lib/queue/worker-init');
            await shutdownQueueSystem();
            process.exit(0);
          } catch (error) {
            console.error('Error during graceful shutdown:', error);
            process.exit(1);
          }
        });
      });
    }
  } catch (error) {
    console.error(
      '⚠️  [instrumented.ts] Failed to initialize queue system:',
      error instanceof Error ? error.message : String(error)
    );

    // In development, don't crash the app
    // In production, you may want to alert or handle differently
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Queue system failed to initialize in production!');
    }
  }
}
