/**
 * Hook: useAnalyticsMetrics
 * Story 3.7: Analytics Dashboard UI
 * Fetches metrics from /api/analytics/metrics endpoint
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import type { AnalyticsResponse } from '@/lib/types/analytics';

interface UseAnalyticsMetricsOptions {
  days?: number;
  customStart?: Date;
  customEnd?: Date;
  userId?: string;
}

interface UseAnalyticsMetricsReturn {
  data: AnalyticsResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAnalyticsMetrics(
  options: UseAnalyticsMetricsOptions = {}
): UseAnalyticsMetricsReturn {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (options.days) {
        params.append('days', options.days.toString());
      }

      if (options.customStart && options.customEnd) {
        params.append('startDate', options.customStart.toISOString());
        params.append('endDate', options.customEnd.toISOString());
      }

      if (options.userId) {
        params.append('userId', options.userId);
      }

      const response = await fetch(`/api/analytics/metrics?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics metrics: ${response.statusText}`);
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [options.days, options.customStart, options.customEnd, options.userId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}
