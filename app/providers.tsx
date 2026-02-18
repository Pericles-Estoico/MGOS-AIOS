'use client';

import { useServiceWorker } from '@/hooks/use-service-worker';
import { usePerformanceMonitoring, logPerformanceMetrics } from '@/hooks/use-performance-monitoring';
import { useEffect } from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side providers component
 * Handles Service Worker registration and performance monitoring
 */
export function Providers({ children }: ProvidersProps) {
  // Register Service Worker
  const swState = useServiceWorker();

  // Monitor performance metrics
  usePerformanceMonitoring((metric) => {
    console.log(`📊 ${metric.name}: ${metric.value.toFixed(0)}ms [${metric.rating}]`);
  });

  // Log performance metrics on page load
  useEffect(() => {
    // Wait for page to fully load
    if (document.readyState === 'complete') {
      logPerformanceMetrics();
    } else {
      window.addEventListener('load', logPerformanceMetrics);
      return () => window.removeEventListener('load', logPerformanceMetrics);
    }
  }, []);

  // Show update notification if available
  useEffect(() => {
    if (swState.updateAvailable) {
      console.log('New version available - refresh to update');
      // Could show a toast or banner here
    }
  }, [swState.updateAvailable]);

  useEffect(() => {
    if (swState.error) {
      console.warn('Service Worker error:', swState.error);
    }
  }, [swState.error]);

  return children;
}
