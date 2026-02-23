'use client';

/**
 * Queue System Initializer Component
 * Initializes the BullMQ worker and event listeners on app startup
 */

import { useEffect } from 'react';

export function QueueSystemInitializer() {
  useEffect(() => {
    // Initialize queue system
    const initQueue = async () => {
      try {
        // Dynamic import to avoid server-side initialization issues
        const { initializeQueueSystem } = await import('@/lib/queue/worker-init');
        await initializeQueueSystem();
      } catch (error) {
        console.warn('Queue system initialization failed:', error);
        // Don't crash the app if queue fails
      }
    };

    initQueue();

    // Cleanup on unmount
    return () => {
      // Note: We don't shutdown here as it would happen too early
      // Proper shutdown should be handled by process signals
    };
  }, []);

  return null;
}
