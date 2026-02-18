import { useEffect } from 'react';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface WebVitals {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 }, // milliseconds
  fid: { good: 100, poor: 300 }, // milliseconds
  cls: { good: 0.1, poor: 0.25 }, // score
  ttfb: { good: 600, poor: 1800 }, // milliseconds
};

function getRating(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Hook to monitor Web Vitals and performance metrics
 * Uses Web Vitals API and Performance Observer
 */
export function usePerformanceMonitoring(onMetric?: (metric: PerformanceMetric) => void) {
  useEffect(() => {
    const metrics: WebVitals = {};

    // Try to use Web Vitals if available
    try {
      if ('PerformanceObserver' in window) {
        // Observe Largest Contentful Paint
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            metrics.lcp = lastEntry.renderTime || lastEntry.loadTime || 0;

            if (onMetric && metrics.lcp) {
              onMetric({
                name: 'LCP',
                value: metrics.lcp,
                rating: getRating(metrics.lcp, THRESHOLDS.lcp),
                timestamp: Date.now(),
              });
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.warn('LCP observer not supported');
        }

        // Observe Cumulative Layout Shift
        try {
          const clsObserver = new PerformanceObserver((list) => {
            let cls = 0;
            for (const entry of list.getEntries()) {
              cls += (entry as any).hadRecentInput ? 0 : (entry as any).value;
            }
            metrics.cls = (metrics.cls || 0) + cls;

            if (onMetric && metrics.cls > 0) {
              onMetric({
                name: 'CLS',
                value: metrics.cls,
                rating: getRating(metrics.cls, THRESHOLDS.cls),
                timestamp: Date.now(),
              });
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.warn('CLS observer not supported');
        }

        // Observe First Input Delay (deprecated, but still useful)
        try {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            for (const entry of entries) {
              const processingDuration = (entry as any).processingDuration || 0;
              if (processingDuration > 0) {
                metrics.fid = processingDuration;

                if (onMetric && metrics.fid !== undefined) {
                  onMetric({
                    name: 'FID',
                    value: metrics.fid,
                    rating: getRating(metrics.fid, THRESHOLDS.fid),
                    timestamp: Date.now(),
                  });
                }
              }
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          console.warn('FID observer not supported');
        }
      }

      // Get Time to First Byte from navigation timing
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigationTiming = performance.getEntriesByType('navigation')[0] as any;
        if (navigationTiming && navigationTiming.responseStart && navigationTiming.requestStart) {
          metrics.ttfb = navigationTiming.responseStart - navigationTiming.requestStart;

          if (onMetric && metrics.ttfb > 0) {
            onMetric({
              name: 'TTFB',
              value: metrics.ttfb,
              rating: getRating(metrics.ttfb, THRESHOLDS.ttfb),
              timestamp: Date.now(),
            });
          }
        }
      }
    } catch (error) {
      console.error('Performance monitoring error:', error);
    }
  }, [onMetric]);
}

/**
 * Utility to log performance metrics
 */
export function logPerformanceMetrics() {
  try {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const navigationTiming = performance.getEntriesByType('navigation')[0] as any;

      console.group('📊 Performance Metrics');

      // Paint timings
      paintEntries.forEach((entry) => {
        console.log(`${entry.name}: ${Math.round(entry.startTime)}ms`);
      });

      // Navigation timing
      if (navigationTiming) {
        console.log(`DNS: ${Math.round(navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart)}ms`);
        console.log(`TCP: ${Math.round(navigationTiming.connectEnd - navigationTiming.connectStart)}ms`);
        console.log(`TTFB: ${Math.round(navigationTiming.responseStart - navigationTiming.requestStart)}ms`);
        console.log(`DOMContentLoaded: ${Math.round(navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart)}ms`);
        console.log(`Load: ${Math.round(navigationTiming.loadEventEnd - navigationTiming.navigationStart)}ms`);
      }

      console.groupEnd();
    }
  } catch (error) {
    console.error('Error logging performance metrics:', error);
  }
}
