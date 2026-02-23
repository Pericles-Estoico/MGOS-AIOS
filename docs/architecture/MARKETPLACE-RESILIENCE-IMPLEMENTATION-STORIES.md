# 🚀 Marketplace Resilience Implementation Stories
**Extracted from:** MARKETPLACE-RESILIENCE-SYSTEM.md
**Status:** Ready for Sprint Planning
**Date:** 2026-02-23

---

## Overview

This document translates the 4-phase architecture design into executable stories for development. Each story is fully specified with acceptance criteria, implementation tasks, and complexity estimates.

**Roadmap:**
- **Phase 1 (v1):** ✅ **DONE** - Fallback mechanisms + recovery + diagnostics
- **Phase 2 (v2):** 📋 **NEXT** - Queue system + worker pattern + retry logic
- **Phase 3 (v3):** 📋 **FUTURE** - Monitoring + alerting + dashboards
- **Phase 4 (v4):** 📋 **FUTURE** - ML prediction + adaptive optimization

---

## PHASE 2: QUEUE SYSTEM (Est: 2-3 weeks)

### Story 4.1: Set Up Redis Infrastructure

**Epic:** Marketplace Resilience System v2
**Complexity:** Medium (T-shirt: M | Points: 8)
**Dependencies:** None
**Time Estimate:** 3-4 days

**Description:**
Set up Redis as persistent job queue for marketplace analysis Phase 1 creation. Includes local development setup, cloud configuration for production, and connection management.

**Acceptance Criteria:**
1. ✅ Redis running locally (Docker container or local instance)
2. ✅ Redis configured in production (AWS ElastiCache or equivalent)
3. ✅ Connection pooling implemented (max 50 concurrent)
4. ✅ Authentication credentials in `.env` (separate dev/prod)
5. ✅ Health check endpoint: `GET /api/health/redis`
6. ✅ Connection retry logic with exponential backoff
7. ✅ Monitoring metrics exported (connections, commands, latency)

**Implementation Tasks:**
- [ ] Create `lib/redis-client.ts` with connection pooling
- [ ] Add Redis configuration to `.env.example` and `.env.local`
- [ ] Implement health check middleware
- [ ] Add Docker Compose configuration for local Redis
- [ ] Create AWS ElastiCache Terraform config for production
- [ ] Write integration tests for connection/reconnection
- [ ] Document Redis setup in CONTRIBUTING.md

**Acceptance Test:**
```bash
npm run dev
# In another terminal:
curl http://localhost:3000/api/health/redis
# Expected: { "status": "connected", "latency": "2ms" }
```

---

### Story 4.2: Implement BullMQ Job Queue

**Epic:** Marketplace Resilience System v2
**Complexity:** Large (T-shirt: L | Points: 13)
**Dependencies:** Story 4.1 (Redis setup)
**Time Estimate:** 5-6 days

**Description:**
Implement BullMQ as the job queue system for Phase 1 task creation. This replaces synchronous function calls with asynchronous, reliable job processing with automatic retries.

**Acceptance Criteria:**
1. ✅ BullMQ queue created: `phase1-tasks`
2. ✅ Job schema defined with typed validation
3. ✅ Retry logic: exponential backoff (1s → 5s → 30s)
4. ✅ Max retries: 3 (configurable via .env)
5. ✅ Failed jobs moved to dead-letter queue
6. ✅ Job progress tracking (states: pending → active → completed)
7. ✅ Event emission (job:enqueued, job:active, job:completed, job:failed)
8. ✅ Worker process handles jobs with timeout (10s per job)
9. ✅ Graceful shutdown: wait for in-flight jobs to complete
10. ✅ Integration with existing approval flow (backward compatible)

**Implementation Tasks:**
- [ ] Install `bullmq` and `@types/bullmq`
- [ ] Create `lib/queue/phase1-queue.ts`
  - Queue initialization with Redis client
  - Job type definition with Zod validation
  - Enqueue function with metadata
- [ ] Create `lib/queue/phase1-worker.ts`
  - Worker implementation that processes Phase 1 jobs
  - Calls existing `createPhase1Tasks()` function
  - Error handling + logging
- [ ] Create `lib/queue/queue-events.ts`
  - Event emitter for job status changes
  - Webhook notifications on completion/failure
- [ ] Update `PATCH /api/marketplace/analysis/[id]` route
  - Replace synchronous `createPhase1Tasks()` with queue enqueue
  - Return 202 Accepted with job ID
  - Implement polling endpoint: `GET /api/marketplace/jobs/{jobId}`
- [ ] Create `GET /api/marketplace/jobs/{jobId}` endpoint
  - Returns job status, progress, and result
  - 404 if job not found
- [ ] Add worker startup to app initialization
  - Worker runs in separate process or thread pool
  - Auto-reconnect on failure
- [ ] Write unit tests for queue operations
- [ ] Write integration tests for end-to-end flow

**Database Schema Changes:**
```sql
-- Track job execution for audit trail
CREATE TABLE marketplace_job_executions (
  id UUID PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES marketplace_plans(id),
  job_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL, -- pending, active, completed, failed
  error_message TEXT,
  attempt_number INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  result JSONB
);

CREATE INDEX idx_plan_id_job ON marketplace_job_executions(plan_id);
```

**Acceptance Test:**
```javascript
// Test enqueue workflow
const planId = 'test-plan-123';
const response = await fetch(`/api/marketplace/analysis/${planId}`, {
  method: 'PATCH',
  body: JSON.stringify({ action: 'approve' })
});
// Expected: 202 Accepted
const { jobId } = await response.json();

// Poll for completion
let status = 'pending';
while (status !== 'completed') {
  await new Promise(r => setTimeout(r, 500));
  const jobResponse = await fetch(`/api/marketplace/jobs/${jobId}`);
  const job = await jobResponse.json();
  status = job.status;
}
// Expected: status === 'completed', tasks created
```

---

### Story 4.3: Implement Circuit Breaker Pattern

**Epic:** Marketplace Resilience System v2
**Complexity:** Medium (T-shirt: M | Points: 8)
**Dependencies:** Story 4.1 (Redis)
**Time Estimate:** 3-4 days

**Description:**
Implement circuit breaker to prevent cascading failures when agents are timing out or returning errors. Stops trying to call failing agents and uses fallback instead.

**Acceptance Criteria:**
1. ✅ Circuit breaker states: CLOSED → OPEN → HALF_OPEN → CLOSED
2. ✅ Failure threshold: 5 consecutive errors
3. ✅ Success threshold for recovery: 2 successful calls
4. ✅ Timeout duration: 60s (configurable)
5. ✅ Per-agent tracking (separate circuit for each marketplace agent)
6. ✅ Fallback to cached results or empty analysis when circuit OPEN
7. ✅ Metrics exported: state transitions, error rates, recovery time
8. ✅ Recovers gracefully when agent comes back online

**Implementation Tasks:**
- [ ] Create `lib/resilience/circuit-breaker.ts`
  - Generic circuit breaker class
  - Configurable thresholds
  - State machine implementation
- [ ] Create `lib/resilience/agent-circuit-breaker.ts`
  - Agent-specific circuit breaker instances
  - Track per-agent state
- [ ] Update `callAgent()` function in agent-loop.ts
  - Wrap agent calls with circuit breaker
  - Fall back to empty analysis if circuit OPEN
  - Log circuit state transitions
- [ ] Update diagnostics endpoint
  - Add circuit breaker status per agent
  - Show recovery time remaining
  - Recommend when to retry
- [ ] Write unit tests for all states
- [ ] Write integration tests with mock failing agents

**Acceptance Test:**
```javascript
// Simulate 5 agent failures
for (let i = 0; i < 5; i++) {
  await callAgent('amazon', { /* will fail */ });
}
// Circuit should be OPEN now
const status = await getCircuitBreakerStatus('amazon');
// Expected: status.state === 'OPEN'

// Next call should fail fast without calling agent
const t0 = Date.now();
const result = await callAgent('amazon', { /* will fail */ });
const elapsed = Date.now() - t0;
// Expected: elapsed < 100ms (immediate rejection), result.fallback === true

// After 60s + 2 successful calls, circuit should recover
```

---

### Story 4.4: Implement Retry Logic with Exponential Backoff

**Epic:** Marketplace Resilience System v2
**Complexity:** Small (T-shirt: S | Points: 5)
**Dependencies:** Story 4.2 (BullMQ)
**Time Estimate:** 2-3 days

**Description:**
Implement exponential backoff retry logic for failed job processing. Jobs that fail are automatically retried with increasing delays (1s → 5s → 30s).

**Acceptance Criteria:**
1. ✅ Retry delays: 1s, 5s, 30s (configurable)
2. ✅ Max retries: 3 (configurable)
3. ✅ Only retry on recoverable errors (network, timeout, rate limit)
4. ✅ Permanent errors (validation, auth) fail immediately
5. ✅ Dead-letter queue for failed jobs
6. ✅ Metrics tracked: retry count, delay duration, success rate
7. ✅ Logging shows retry attempt number and reason

**Implementation Tasks:**
- [ ] Create `lib/resilience/retry-strategy.ts`
  - Calculate exponential backoff delay
  - Classify errors (recoverable vs permanent)
  - Generate retry schedule
- [ ] Update BullMQ worker to use retry strategy
- [ ] Update dead-letter queue handling
  - Archive failed jobs to DB for analysis
  - Send notification when job enters DLQ
- [ ] Update diagnostics endpoint
  - Show retry statistics per plan
  - Recommend manual intervention for DLQ items
- [ ] Write tests for retry logic
- [ ] Write tests for error classification

**Acceptance Test:**
```javascript
// Job fails on first attempt (recoverable error)
// Should retry after 1s delay
let callCount = 0;
agent.mockImplementation(() => {
  callCount++;
  if (callCount < 2) throw new Error('Network timeout');
  return { phases: [...] };
});

const job = await enqueuePhase1Job(planId);
// Initially pending
// After 1s: ACTIVE (retry attempt 1)
// After error: re-queued with delay
// After 1s: ACTIVE (retry attempt 2) → succeeds
// Final: COMPLETED with result
```

---

## PHASE 3: MONITORING & ALERTING (Est: 1 week)

### Story 4.5: Set Up Prometheus Metrics Export

**Epic:** Marketplace Resilience System v3
**Complexity:** Medium (T-shirt: M | Points: 8)
**Dependencies:** Story 4.2 (BullMQ)
**Time Estimate:** 3-4 days

**Description:**
Integrate Prometheus to export system metrics from the marketplace queue. Track job processing, queue depth, error rates, and latency.

**Acceptance Criteria:**
1. ✅ Prometheus metrics endpoint: `GET /api/metrics`
2. ✅ Queue metrics: job count by status, queue depth, processing rate
3. ✅ Job metrics: duration, retry count, error rate per plan
4. ✅ Agent metrics: call count, error rate, latency per agent
5. ✅ Circuit breaker metrics: state, transitions, recovery time
6. ✅ System metrics: Redis connection count, memory usage
7. ✅ Histogram buckets for latency: [10ms, 50ms, 100ms, 500ms, 1s, 5s, 10s]
8. ✅ Metrics retention: last 24 hours (configurable)

**Implementation Tasks:**
- [ ] Install `prom-client`
- [ ] Create `lib/metrics/prometheus.ts`
- [ ] Create metrics collectors for:
  - Queue status (gauge: pending, active, completed, failed)
  - Job duration (histogram)
  - Job retry count (histogram)
  - Agent call latency (histogram per agent)
  - Circuit breaker state (gauge per agent)
- [ ] Add `/api/metrics` endpoint
- [ ] Integrate metrics collection in BullMQ worker
- [ ] Integrate metrics in agent calls
- [ ] Write tests for metric collection

**Acceptance Test:**
```bash
curl http://localhost:3000/api/metrics | grep marketplace_
# Expected output includes lines like:
# marketplace_queue_pending_jobs 3
# marketplace_job_duration_seconds_bucket{le="1"} 45
# marketplace_agent_error_rate{agent="amazon"} 0.02
```

---

### Story 4.6: Build Grafana Dashboard

**Epic:** Marketplace Resilience System v3
**Complexity:** Medium (T-shirt: M | Points: 8)
**Dependencies:** Story 4.5 (Prometheus)
**Time Estimate:** 3-4 days

**Description:**
Create Grafana dashboard for real-time visualization of marketplace system health. Display key metrics, alerts, and historical trends.

**Acceptance Criteria:**
1. ✅ Dashboard file: `docs/monitoring/grafana-dashboard.json`
2. ✅ Panels:
   - Queue status (pending/active/completed/failed)
   - Job success rate (%)
   - Average job duration (seconds)
   - Error rate per agent
   - Circuit breaker state per agent
   - Retry statistics
   - P50, P95, P99 latencies
3. ✅ Time range: 24h, 7d, 30d selectable
4. ✅ Alerts panel showing recent failures
5. ✅ Logs panel integrated (optional)
6. ✅ Export as JSON for version control

**Implementation Tasks:**
- [ ] Design dashboard layout
- [ ] Create Grafana dashboard JSON
- [ ] Configure Prometheus as data source
- [ ] Create alert rules for critical metrics
- [ ] Document dashboard usage in README
- [ ] Add screenshot to docs

---

### Story 4.7: Implement Slack Alerting

**Epic:** Marketplace Resilience System v3
**Complexity:** Small (T-shirt: S | Points: 5)
**Dependencies:** Story 4.5 (Prometheus)
**Time Estimate:** 2-3 days

**Description:**
Send Slack notifications for critical events: job failures, circuit breaker state changes, queue overload.

**Acceptance Criteria:**
1. ✅ Alert types: job_failed, circuit_opened, queue_backed_up, recovery_success
2. ✅ Slack message includes: plan_id, error, action taken
3. ✅ Rate limiting: max 1 alert per 5 minutes per issue
4. ✅ Severity levels: info, warning, critical
5. ✅ Webhook URL configured via env var
6. ✅ Graceful degradation if Slack unavailable (logs only)

**Implementation Tasks:**
- [ ] Create `lib/alerts/slack-notifier.ts`
- [ ] Add Slack webhook URL to `.env`
- [ ] Create alert formatter
- [ ] Integrate with job failure handler
- [ ] Integrate with circuit breaker
- [ ] Write tests with mock Slack webhook
- [ ] Document alert rules in runbooks

---

## PHASE 4: ML PREDICTION & OPTIMIZATION (Est: 2-3 weeks)

### Story 4.8: Implement Job Success Prediction

**Epic:** Marketplace Resilience System v4
**Complexity:** Large (T-shirt: L | Points: 13)
**Dependencies:** Story 4.5 (Prometheus metrics)
**Time Estimate:** 5-7 days

**Description:**
Use historical data to predict whether a Phase 1 job will succeed. Route high-risk jobs through circuit breaker earlier or to fallback path.

**Acceptance Criteria:**
1. ✅ Training data: job history (success/failure, duration, error type)
2. ✅ Model type: logistic regression (scikit-learn or TensorFlow.js)
3. ✅ Features: plan size, agent type, time of day, queue depth
4. ✅ Prediction confidence threshold: 70%
5. ✅ Model retrains weekly with new data
6. ✅ Prediction API: `POST /api/predict-job-success`
7. ✅ A/B test: compare fallback vs queue for similar plans
8. ✅ Monitoring: prediction accuracy, feature importance

**Implementation Tasks:**
- [ ] Create `lib/ml/job-predictor.ts`
- [ ] Implement feature extraction from job data
- [ ] Train initial model on historical data
- [ ] Create prediction API endpoint
- [ ] Integrate prediction into approval workflow
- [ ] Set up weekly model retraining
- [ ] Add metrics for prediction accuracy
- [ ] Write tests with sample data

---

### Story 4.9: Implement Adaptive Timeout Strategy

**Epic:** Marketplace Resilience System v4
**Complexity:** Medium (T-shirt: M | Points: 8)
**Dependencies:** Story 4.8 (ML prediction)
**Time Estimate:** 3-4 days

**Description:**
Dynamically adjust job timeout based on plan characteristics and historical performance. Prevents unnecessary timeouts for complex plans.

**Acceptance Criteria:**
1. ✅ Base timeout: 30s
2. ✅ Adjustment factors:
   - Plan size: +5s per 100 opportunities
   - Agent failures: +5s per circuit breaker transition
   - Time of day: +10s during peak hours
3. ✅ Max timeout: 120s
4. ✅ Min timeout: 10s
5. ✅ Metrics: timeout rate, distribution of adjusted timeouts
6. ✅ Configurable via environment variables

**Implementation Tasks:**
- [ ] Create `lib/resilience/adaptive-timeout.ts`
- [ ] Calculate dynamic timeout in worker
- [ ] Update BullMQ job configuration
- [ ] Log timeout decisions for analysis
- [ ] Add metrics for timeout analysis
- [ ] Write tests for timeout calculation

---

## Integration & Rollout Strategy

### Deployment Phases

**Phase 2A (Week 1):** Foundation
- Redis setup (local + cloud)
- BullMQ basic queue
- Integration with approval flow
- Backward compatibility testing

**Phase 2B (Week 2):** Reliability
- Retry logic
- Circuit breaker
- Dead-letter queue handling

**Phase 2C (Week 3):** Validation
- Load testing (1000+ concurrent jobs)
- Chaos testing (simulate failures)
- Performance tuning
- SLA validation

**Phase 3A (Week 4):** Observability
- Prometheus metrics
- Grafana dashboards
- Slack alerts

**Phase 3B (Week 5):** Production Ready
- Runbooks written
- On-call setup
- Monitoring dashboards deployed
- Alert thresholds calibrated

**Phase 4 (Weeks 6+):** Optimization
- ML model training
- A/B testing
- Adaptive timeout tuning

### Rollback Plan

If queue system causes issues:
1. Revert approval handler to use synchronous function call
2. Drain queue (complete pending jobs)
3. Archive queue data for analysis
4. Document failure mode for post-mortem

### Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| P99 job completion time | N/A | < 5s |
| Job success rate | ~90% | > 99% |
| Stalls per week | 2-3 | 0 |
| MTTR (mean time to recovery) | 30+ min | < 30s |
| System uptime | 95% | 99.9% |
| Queue depth (p99) | N/A | < 50 jobs |

---

## Team Assignments (Recommended)

- **@dev (Dex):** Implementation of all stories (lead)
- **@architect (Aria):** Design review, architecture guidance
- **@qa (Quinn):** Testing, load testing, chaos engineering
- **@devops (Gage):** Infrastructure (Redis cloud, Prometheus, Grafana)
- **@data-engineer (Dara):** Data modeling for metrics, ML pipeline

---

## Success Criteria for Phase 2 Completion

- [ ] All BullMQ functionality working end-to-end
- [ ] Retry logic proven with load test
- [ ] Circuit breaker prevents cascading failures
- [ ] 99%+ job success rate in staging
- [ ] <5s P99 job completion time
- [ ] Zero breaking changes to existing flow
- [ ] Backward compatible with synchronous calls (fallback)
- [ ] Comprehensive test coverage (>80%)
- [ ] Documentation complete

---

**Next Step:** Present this document to team for sprint planning and story refinement.

Generated by @architect (Aria) — 2026-02-23
