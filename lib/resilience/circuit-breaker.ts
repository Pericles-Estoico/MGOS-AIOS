/**
 * Generic Circuit Breaker Implementation
 * State machine: CLOSED → OPEN → HALF_OPEN → CLOSED
 * Prevents cascading failures in distributed systems
 */

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Consecutive failures to open circuit (default: 5)
  successThreshold: number; // Successful calls in HALF_OPEN to close (default: 2)
  timeout: number; // Milliseconds before OPEN → HALF_OPEN (default: 60000)
  name?: string; // Optional name for logging
}

export interface CircuitBreakerMetrics {
  state: CircuitBreakerState;
  consecutiveErrors: number;
  consecutiveSuccesses: number;
  totalRequests: number;
  totalErrors: number;
  totalSuccesses: number;
  lastErrorAt?: Date;
  lastSuccessAt?: Date;
  openedAt?: Date;
  recoveryTimeRemaining?: number; // MS until OPEN → HALF_OPEN transition
}

/**
 * Generic circuit breaker class
 * Can be used for any service (agents, external APIs, etc.)
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private consecutiveErrors: number = 0;
  private consecutiveSuccesses: number = 0;
  private totalRequests: number = 0;
  private totalErrors: number = 0;
  private totalSuccesses: number = 0;
  private lastErrorAt?: Date;
  private lastSuccessAt?: Date;
  private openedAt?: Date;

  constructor(private config: CircuitBreakerConfig) {
    // Provide defaults
    if (!this.config.failureThreshold) {
      this.config.failureThreshold = 5;
    }
    if (!this.config.successThreshold) {
      this.config.successThreshold = 2;
    }
    if (!this.config.timeout) {
      this.config.timeout = 60000; // 60 seconds
    }
    if (!this.config.name) {
      this.config.name = 'CircuitBreaker';
    }
  }

  /**
   * Record a successful call
   * - In CLOSED: reset error counter
   * - In HALF_OPEN: increment success counter, close on threshold
   * - In OPEN: no effect
   */
  recordSuccess(): void {
    this.totalRequests++;
    this.totalSuccesses++;
    this.lastSuccessAt = new Date();

    if (this.state === CircuitBreakerState.CLOSED) {
      // Reset error counter on success while closed
      this.consecutiveErrors = 0;
      console.log(`[${this.config.name}] ✅ Success in CLOSED state, errors reset to 0`);
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Count successes in HALF_OPEN
      this.consecutiveSuccesses++;
      console.log(
        `[${this.config.name}] ✅ Success in HALF_OPEN state (${this.consecutiveSuccesses}/${this.config.successThreshold})`
      );

      // Close circuit if success threshold reached
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    }
    // OPEN state: no action needed, but log for visibility
    if (this.state === CircuitBreakerState.OPEN) {
      console.log(
        `[${this.config.name}] ℹ️  Success logged while OPEN (state will transition on next call)`
      );
    }
  }

  /**
   * Record a failed call
   * - In CLOSED: increment error counter, open on threshold
   * - In HALF_OPEN: open immediately
   * - In OPEN: no effect (already open)
   */
  recordFailure(): void {
    this.totalRequests++;
    this.totalErrors++;
    this.lastErrorAt = new Date();

    if (this.state === CircuitBreakerState.CLOSED) {
      // Increment error counter
      this.consecutiveErrors++;
      console.log(
        `[${this.config.name}] ❌ Failure in CLOSED state (${this.consecutiveErrors}/${this.config.failureThreshold})`
      );

      // Open circuit if failure threshold reached
      if (this.consecutiveErrors >= this.config.failureThreshold) {
        this.transitionToOpen();
      }
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in HALF_OPEN immediately reopens circuit
      console.log(`[${this.config.name}] ❌ Failure in HALF_OPEN state, reopening circuit`);
      this.transitionToOpen();
    }
    // OPEN state: no action needed, just log
    if (this.state === CircuitBreakerState.OPEN) {
      console.log(`[${this.config.name}] ℹ️  Failure logged while OPEN (circuit already open)`);
    }
  }

  /**
   * Check circuit state and attempt transition if needed
   * Returns true if circuit is CLOSED or HALF_OPEN (request allowed)
   * Returns false if circuit is OPEN (request should be rejected)
   */
  canAttempt(): boolean {
    // Check if OPEN state timeout has expired
    if (this.state === CircuitBreakerState.OPEN && this.openedAt) {
      const elapsedMs = Date.now() - this.openedAt.getTime();
      if (elapsedMs >= this.config.timeout) {
        this.transitionToHalfOpen();
        return true; // Allow attempt in HALF_OPEN
      }
      return false; // Still OPEN, reject attempt
    }

    return this.state !== CircuitBreakerState.OPEN;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get detailed metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    const metrics: CircuitBreakerMetrics = {
      state: this.state,
      consecutiveErrors: this.consecutiveErrors,
      consecutiveSuccesses: this.consecutiveSuccesses,
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      totalSuccesses: this.totalSuccesses,
      lastErrorAt: this.lastErrorAt,
      lastSuccessAt: this.lastSuccessAt,
      openedAt: this.openedAt,
    };

    // Calculate recovery time remaining if OPEN
    if (this.state === CircuitBreakerState.OPEN && this.openedAt) {
      const elapsedMs = Date.now() - this.openedAt.getTime();
      const remainingMs = Math.max(0, this.config.timeout - elapsedMs);
      metrics.recoveryTimeRemaining = remainingMs;
    }

    return metrics;
  }

  /**
   * Reset circuit to CLOSED state (for testing or manual intervention)
   */
  reset(): void {
    console.log(`[${this.config.name}] 🔄 Circuit reset to CLOSED`);
    this.state = CircuitBreakerState.CLOSED;
    this.consecutiveErrors = 0;
    this.consecutiveSuccesses = 0;
    this.openedAt = undefined;
  }

  /**
   * Private state transition methods
   */
  private transitionToOpen(): void {
    this.state = CircuitBreakerState.OPEN;
    this.openedAt = new Date();
    this.consecutiveSuccesses = 0;
    console.log(
      `[${this.config.name}] 🔴 Circuit OPENED (will transition to HALF_OPEN in ${this.config.timeout}ms)`
    );
  }

  private transitionToHalfOpen(): void {
    this.state = CircuitBreakerState.HALF_OPEN;
    this.consecutiveSuccesses = 0;
    this.consecutiveErrors = 0;
    console.log(`[${this.config.name}] 🟡 Circuit transitioned to HALF_OPEN (testing recovery)`);
  }

  private transitionToClosed(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.consecutiveErrors = 0;
    this.consecutiveSuccesses = 0;
    this.openedAt = undefined;
    console.log(`[${this.config.name}] 🟢 Circuit CLOSED (normal operation resumed)`);
  }
}

/**
 * Utility function to execute code with circuit breaker protection
 * @param breaker Circuit breaker instance
 * @param operation Async function to execute
 * @param fallback Function to execute if circuit is OPEN
 * @returns Result from operation or fallback
 */
export async function executeWithCircuitBreaker<T>(
  breaker: CircuitBreaker,
  operation: () => Promise<T>,
  fallback: () => Promise<T> | T
): Promise<T> {
  // Check if request is allowed
  if (!breaker.canAttempt()) {
    console.log('Circuit breaker is OPEN, using fallback');
    breaker.recordFailure();
    return typeof fallback === 'function' ? await fallback() : fallback;
  }

  try {
    const result = await operation();
    breaker.recordSuccess();
    return result;
  } catch (error) {
    breaker.recordFailure();
    throw error;
  }
}
