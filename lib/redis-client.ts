/**
 * Redis client with connection pooling, retry logic, and monitoring
 * Used for job queue, caching, and marketplace analysis Phase 1 task management
 */

import Redis, { RedisOptions } from 'ioredis';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Configuration
const REDIS_CONFIG = {
  development: {
    host: process.env.REDIS_HOST_DEV || 'localhost',
    port: parseInt(process.env.REDIS_PORT_DEV || '6379'),
    password: process.env.REDIS_PASSWORD_DEV,
    db: 0,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    enableOfflineQueue: true,
  },
  production: {
    host: process.env.REDIS_HOST_PROD || 'redis.prod.example.com',
    port: parseInt(process.env.REDIS_PORT_PROD || '6379'),
    password: process.env.REDIS_PASSWORD_PROD,
    db: 0,
    ssl: process.env.REDIS_SSL_PROD === 'true',
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    enableOfflineQueue: true,
  },
};

// Connection pooling settings
const POOL_CONFIG = {
  maxSize: isDevelopment ? 50 : 100,
  minSize: isDevelopment ? 5 : 20,
};

// Retry configuration with exponential backoff
const RETRY_CONFIG = {
  baseDelay: 1000, // 1s
  maxDelay: 30000, // 30s
  maxAttempts: 5,
};

// Metrics tracking
interface RedisMetrics {
  connections: number;
  commands: number;
  errors: number;
  latency: number[];
  lastChecked: Date;
}

const metrics: RedisMetrics = {
  connections: 0,
  commands: 0,
  errors: 0,
  latency: [],
  lastChecked: new Date(),
};

// Single instance (singleton pattern)
let redisInstance: Redis | null = null;
let isConnected = false;

/**
 * Get or create Redis client instance
 */
export function getRedisClient(): Redis {
  if (redisInstance) {
    return redisInstance;
  }

  const env = isDevelopment ? 'development' : 'production';
  const config = REDIS_CONFIG[env as keyof typeof REDIS_CONFIG];

  const redisOptions: RedisOptions = {
    ...config,
    retryStrategy: (times: number) => {
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, times - 1),
        RETRY_CONFIG.maxDelay
      );
      if (times > RETRY_CONFIG.maxAttempts) {
        console.error(
          `❌ Redis: Max retry attempts exceeded (${RETRY_CONFIG.maxAttempts})`
        );
        return null; // Stop retrying
      }
      console.warn(
        `⏳ Redis: Retrying connection (attempt ${times}, delay ${delay}ms)`
      );
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true; // Retry
      }
      return false;
    },
  };

  redisInstance = new Redis(redisOptions);

  // Event handlers
  redisInstance.on('connect', () => {
    isConnected = true;
    metrics.connections++;
    console.log('✅ Redis connected');
  });

  redisInstance.on('error', (err) => {
    isConnected = false;
    metrics.errors++;
    console.error('❌ Redis error:', err.message);
  });

  redisInstance.on('close', () => {
    isConnected = false;
    console.warn('⚠️ Redis connection closed');
  });

  redisInstance.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
  });

  return redisInstance;
}

/**
 * Health check - test Redis connectivity
 */
export async function checkRedisHealth(): Promise<{
  status: 'connected' | 'disconnected' | 'error';
  latency: number;
  error?: string;
}> {
  try {
    const client = getRedisClient();
    const startTime = Date.now();

    // Send PING command
    const pong = await client.ping();
    const latency = Date.now() - startTime;

    // Track metrics
    metrics.latency.push(latency);
    if (metrics.latency.length > 100) {
      metrics.latency.shift(); // Keep last 100 pings
    }

    if (pong === 'PONG') {
      return {
        status: 'connected',
        latency,
      };
    } else {
      return {
        status: 'error',
        latency,
        error: `Unexpected PING response: ${pong}`,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    metrics.errors++;
    return {
      status: 'disconnected',
      latency: 0,
      error: errorMessage,
    };
  }
}

/**
 * Get current metrics
 */
export function getRedisMetrics() {
  const avgLatency =
    metrics.latency.length > 0
      ? Math.round(
          metrics.latency.reduce((a, b) => a + b, 0) / metrics.latency.length
        )
      : 0;

  return {
    status: isConnected ? 'connected' : 'disconnected',
    connections: metrics.connections,
    commands: metrics.commands,
    errors: metrics.errors,
    averageLatency: avgLatency,
    lastChecked: metrics.lastChecked,
  };
}

/**
 * Graceful disconnect
 */
export async function disconnectRedis(): Promise<void> {
  if (redisInstance) {
    try {
      // Use quit() which allows in-flight commands to finish
      // If connection is already closed, this will throw and we catch it
      await redisInstance.quit();
    } catch (error) {
      // Connection may already be closed
      console.warn(
        '⚠️ Redis disconnect warning:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      redisInstance = null;
      isConnected = false;
      console.log('✅ Redis disconnected');
    }
  }
}

/**
 * Reset metrics (for testing)
 */
export function resetMetrics(): void {
  metrics.commands = 0;
  metrics.errors = 0;
  metrics.latency = [];
  metrics.lastChecked = new Date();
}

// Auto-initialize on import in production
if (isProduction && typeof window === 'undefined') {
  getRedisClient();
}

export default getRedisClient;
