import { useCallback, useEffect, useState } from 'react';

interface QueryOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number; // milliseconds
  focusThrottleInterval?: number; // milliseconds
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  error: Error | null;
}

// Global cache for query results
const queryCache = new Map<string, CacheEntry<unknown>>();
const activeFetches = new Map<string, Promise<unknown>>();

const DEFAULT_OPTIONS: QueryOptions = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // 5 seconds
  focusThrottleInterval: 5000, // 5 seconds
};

/**
 * Custom hook for efficient data fetching with automatic caching
 * Prevents duplicate requests within dedupingInterval
 * Automatically refreshes data on window focus/reconnect
 */
export function useTasksQuery<T = unknown>(
  url: string | null,
  options: QueryOptions = {}
) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const cacheKey = url || '';

  // Fetch function with deduping
  const fetch = useCallback(async () => {
    if (!url) return;

    setLoading(true);

    try {
      // Check cache validity
      const cached = queryCache.get(cacheKey);
      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < mergedOptions.dedupingInterval!) {
          setData(cached.data as T);
          setError(cached.error);
          setLoading(false);
          return;
        }
      }

      // Check if fetch already in progress (deduping)
      if (activeFetches.has(cacheKey)) {
        const result = (await activeFetches.get(cacheKey)) as CacheEntry<T>;
        setData(result.data);
        setError(result.error);
        setLoading(false);
        return;
      }

      // Start new fetch using correct fetch reference
      const doFetch = async () => {
        try {
          const response = await globalThis.fetch(url);
          if (!response.ok) throw new Error(`API error: ${response.status}`);
          return await response.json();
        } catch (err) {
          throw err instanceof Error ? err : new Error(String(err));
        }
      };

      const fetchPromise = doFetch();
      activeFetches.set(cacheKey, fetchPromise);

      const result = await fetchPromise;
      const cacheEntry: CacheEntry<T> = {
        data: result,
        timestamp: Date.now(),
        error: null,
      };

      queryCache.set(cacheKey, cacheEntry);
      setData(result);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const cacheEntry: CacheEntry<T> = {
        data: undefined as unknown as T,
        timestamp: Date.now(),
        error,
      };
      queryCache.set(cacheKey, cacheEntry);
      setError(error);
      setData(undefined);
    } finally {
      activeFetches.delete(cacheKey);
      setLoading(false);
    }
  }, [url, cacheKey, mergedOptions]);

  // Initial fetch
  useEffect(() => {
    fetch();
  }, [url]);

  // Revalidate on focus
  useEffect(() => {
    if (!mergedOptions.revalidateOnFocus) return;

    let lastFocusTime = 0;
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusTime > mergedOptions.focusThrottleInterval!) {
        lastFocusTime = now;
        // Invalidate cache on focus
        queryCache.delete(cacheKey);
        fetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetch, cacheKey, mergedOptions]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!mergedOptions.revalidateOnReconnect) return;

    const handleOnline = () => {
      // Invalidate cache on reconnect
      queryCache.delete(cacheKey);
      fetch();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetch, cacheKey, mergedOptions]);

  return { data, error, loading, refetch: fetch };
}

/**
 * Manual cache invalidation for when data changes
 */
export function invalidateQuery(url: string) {
  queryCache.delete(url);
}

/**
 * Clear all cached queries
 */
export function clearQueryCache() {
  queryCache.clear();
  activeFetches.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  return {
    cacheSize: queryCache.size,
    activeFetches: activeFetches.size,
    cacheKeys: Array.from(queryCache.keys()),
  };
}
