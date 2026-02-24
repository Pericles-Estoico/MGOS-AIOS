/**
 * Agent-Specific Circuit Breaker Management
 * Maintains per-agent circuit breaker instances
 * Ensures isolation between agents and independent failure tracking
 */

import { CircuitBreaker, CircuitBreakerState, CircuitBreakerMetrics } from './circuit-breaker';

export const MARKETPLACE_AGENTS = ['amazon', 'mercadolivre', 'shopee', 'shein', 'tiktok-shop'] as const;
export type MarketplaceAgent = (typeof MARKETPLACE_AGENTS)[number];

/**
 * Singleton registry of circuit breakers per agent
 */
class AgentCircuitBreakerRegistry {
  private breakers: Map<MarketplaceAgent, CircuitBreaker> = new Map();

  constructor() {
    // Initialize circuit breaker for each marketplace agent
    for (const agent of MARKETPLACE_AGENTS) {
      this.breakers.set(
        agent,
        new CircuitBreaker({
          name: `Agent[${agent}]`,
          failureThreshold: 5,
          successThreshold: 2,
          timeout: 60000, // 60 seconds
        })
      );
    }
  }

  /**
   * Get circuit breaker for specific agent
   */
  getBreaker(agent: MarketplaceAgent): CircuitBreaker {
    const breaker = this.breakers.get(agent);
    if (!breaker) {
      throw new Error(`Unknown agent: ${agent}`);
    }
    return breaker;
  }

  /**
   * Get all circuit breakers
   */
  getAllBreakers(): Map<MarketplaceAgent, CircuitBreaker> {
    return this.breakers;
  }

  /**
   * Get metrics for all agents
   */
  getAllMetrics(): Record<MarketplaceAgent, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};

    for (const [agent, breaker] of this.breakers) {
      metrics[agent] = breaker.getMetrics();
    }

    return metrics as Record<MarketplaceAgent, CircuitBreakerMetrics>;
  }

  /**
   * Reset circuit breaker for specific agent (for testing/manual intervention)
   */
  resetAgent(agent: MarketplaceAgent): void {
    const breaker = this.getBreaker(agent);
    breaker.reset();
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// Singleton instance
let registry: AgentCircuitBreakerRegistry | null = null;

/**
 * Initialize or get the circuit breaker registry (singleton)
 */
export function getCircuitBreakerRegistry(): AgentCircuitBreakerRegistry {
  if (!registry) {
    registry = new AgentCircuitBreakerRegistry();
    console.log('✅ Circuit breaker registry initialized');
  }
  return registry;
}

/**
 * Get circuit breaker for specific agent
 */
export function getAgentCircuitBreaker(agent: MarketplaceAgent): CircuitBreaker {
  return getCircuitBreakerRegistry().getBreaker(agent);
}

/**
 * Get status for all agents (for diagnostics endpoint)
 */
export function getAllAgentCircuitBreakerStatus(): Record<
  MarketplaceAgent,
  {
    state: CircuitBreakerState;
    consecutiveErrors: number;
    recoveryTimeRemaining?: number;
  }
> {
  const registry = getCircuitBreakerRegistry();
  const allMetrics = registry.getAllMetrics();
  const status: Record<string, object> = {};

  for (const agent of MARKETPLACE_AGENTS) {
    const metrics = allMetrics[agent];
    status[agent] = {
      state: metrics.state,
      consecutiveErrors: metrics.consecutiveErrors,
      recoveryTimeRemaining: metrics.recoveryTimeRemaining,
    };
  }

  return status as Record<
    MarketplaceAgent,
    {
      state: CircuitBreakerState;
      consecutiveErrors: number;
      recoveryTimeRemaining?: number;
    }
  >;
}

/**
 * Get detailed status for specific agent
 */
export function getAgentCircuitBreakerStatus(agent: MarketplaceAgent) {
  const breaker = getAgentCircuitBreaker(agent);
  const metrics = breaker.getMetrics();

  return {
    agent,
    state: metrics.state,
    consecutiveErrors: metrics.consecutiveErrors,
    consecutiveSuccesses: metrics.consecutiveSuccesses,
    totalRequests: metrics.totalRequests,
    totalErrors: metrics.totalErrors,
    totalSuccesses: metrics.totalSuccesses,
    errorRate: metrics.totalRequests > 0 ? (metrics.totalErrors / metrics.totalRequests) * 100 : 0,
    lastErrorAt: metrics.lastErrorAt,
    lastSuccessAt: metrics.lastSuccessAt,
    openedAt: metrics.openedAt,
    recoveryTimeRemaining: metrics.recoveryTimeRemaining,
    recommendation:
      metrics.state === 'OPEN'
        ? `Circuit is OPEN. Wait ${Math.ceil((metrics.recoveryTimeRemaining || 0) / 1000)}s before retrying.`
        : metrics.state === 'HALF_OPEN'
          ? 'Circuit is HALF_OPEN. Testing recovery...'
          : 'Circuit is CLOSED. Normal operation.',
  };
}

/**
 * Check if agent circuit is open (for quick checks in call sites)
 */
export function isAgentCircuitOpen(agent: MarketplaceAgent): boolean {
  const breaker = getAgentCircuitBreaker(agent);
  return !breaker.canAttempt();
}

/**
 * Record agent call success
 */
export function recordAgentSuccess(agent: MarketplaceAgent): void {
  const breaker = getAgentCircuitBreaker(agent);
  breaker.recordSuccess();
}

/**
 * Record agent call failure
 */
export function recordAgentFailure(agent: MarketplaceAgent): void {
  const breaker = getAgentCircuitBreaker(agent);
  breaker.recordFailure();
}

/**
 * Check if agent call can be attempted (respects circuit state and timeout)
 */
export function canAttemptAgentCall(agent: MarketplaceAgent): boolean {
  const breaker = getAgentCircuitBreaker(agent);
  return breaker.canAttempt();
}

/**
 * Reset specific agent circuit (for testing/debugging)
 */
export function resetAgentCircuit(agent: MarketplaceAgent): void {
  const registry = getCircuitBreakerRegistry();
  registry.resetAgent(agent);
}

/**
 * Reset all agent circuits (for testing/debugging)
 */
export function resetAllAgentCircuits(): void {
  const registry = getCircuitBreakerRegistry();
  registry.resetAll();
}
