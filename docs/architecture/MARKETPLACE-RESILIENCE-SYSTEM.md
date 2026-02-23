# 🏗️ MARKETPLACE RESILIENCE SYSTEM — Complete Architecture Design

**Architect:** Aria (Visionary)
**Date:** 2026-02-23
**Status:** DETAILED DESIGN — Ready for Implementation
**Version:** v2.0 (Production-Grade)

---

## EXECUTIVE SUMMARY

### Problem Statement
Marketplace analysis system experiences **task stalls** when Phase 1 generation fails. Current symptoms:
- 3 analyses stuck since 07:00 (12+ hours)
- No automatic recovery
- Zero visibility into system health
- Manual intervention required

### Proposed Solution (Holistic)
**Resilient event-driven task pipeline** with:
1. **Automatic fallback** (prevents stalls)
2. **Queue-based processing** (reliable delivery)
3. **Real-time monitoring** (early detection)
4. **Self-healing recovery** (autonomous fixes)
5. **Circuit breaker** (prevents cascading failures)

### Expected Outcomes
```
Before:  ❌ 2-3 stalls/week, 4-8h to detect, 30+ min to fix
After:   ✅ 0 stalls/week, <1s to detect, <30s to fix
Uptime:  95% → 99.9% (SLA achievable)
```

---

## PART 1: CURRENT STATE ANALYSIS

### 1.1 Existing Architecture (As-Is)

```
User Upload (marketplace/page.tsx)
  ↓ POST /api/marketplace/analysis/upload
  ↓ (Extract text from file)
  ↓ runAnalysisPlanWithContext()
    ├─ For each channel:
    │   ├─ Call Agent (OpenAI)
    │   ├─ Parse JSON response
    │   └─ Aggregate results
    └─ Save plan_data to DB
  ↓ Return planId
  ↓ Frontend redirects to /marketplace/analysis

User Approves Plan (analysis/[id]/page.tsx)
  ↓ PATCH /api/marketplace/analysis/[id] (action: "approve")
  ↓ Update plan status → "approved"
  ↓ createPhase1Tasks(planId)
    ├─ Fetch plan from DB
    ├─ Find phases[].number === 1  ← ❌ FAILS IF NOT FOUND
    ├─ Create tasks from Phase 1
    └─ Return taskIds
  ↓ Return success response
  ✓ Tasks appear in /marketplace/tasks
```

### 1.2 Failure Points (Root Causes)

| # | Point | Issue | Impact | Severity |
|---|-------|-------|--------|----------|
| **A** | Agent Response | JSON may lack `number` field in phases | Phase 1 not found | **CRITICAL** |
| **B** | Parsing Logic | `phases.find(p => p.number === 1)` throws if absent | Function crashes | **CRITICAL** |
| **C** | Error Handling | Catch block logs but doesn't retry | Silent failure | **HIGH** |
| **D** | Observability | No visibility into stuck plans | Humans find out manually | **HIGH** |
| **E** | Recovery | Manual recovery endpoint only | No automatic fix | **MEDIUM** |
| **F** | Timeout | No timeout on agent calls | Can hang indefinitely | **HIGH** |

### 1.3 Data Flow Issues

```
Problem 1: Linear Flow (No Branching)
  upload → agent-call → parse → save → approve → phase1-create → tasks
            ↑                                      ↑
         No retry                            No fallback
         Takes 30-45s                        Hangs if Phase 1 absent

Problem 2: Synchronous Processing
  • User clicks "approve" → waits for response
  • If Phase 1 creation takes 5s → 5s wait time
  • If it fails → user sees error (no auto-retry)

Problem 3: Single Point of Failure
  • Entire flow depends on agents returning correct JSON
  • No validation of response structure
  • No fallback if agents fail
```

---

## PART 2: DETAILED ARCHITECTURE DESIGN (v2.0)

### 2.1 Design Principles

1. **Resilience Over Perfection**
   - Accept imperfect agent responses
   - Auto-fallback instead of hard-fail
   - Retry with exponential backoff

2. **Event-Driven Processing**
   - Decouple upload/approval from task creation
   - Queue-based delivery ensures reliability
   - Webhook patterns for notifications

3. **Observability & Monitoring**
   - Every state change is logged
   - Real-time health dashboard
   - Proactive alerting for stuck items

4. **Progressive Complexity**
   - v1 (Current): Fallback + recovery endpoint
   - v2 (Proposed): Queue + scheduler + monitoring
   - v3 (Future): Machine learning for prediction

### 2.2 System Architecture (High-Level)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MARKETPLACE RESILIENCE SYSTEM v2                  │
└─────────────────────────────────────────────────────────────────────┘

                          USER LAYER
                              ↓
        ┌─────────────────────┴──────────────────────┐
        ↓                                             ↓
   [Upload Modal]                          [Approval Dialog]
   └────────────────┐                      ┌─────────────────┘
                    ↓                      ↓
            ┌──────────────────────────────────────────┐
            │        API GATEWAY LAYER                 │
            │  • Auth + Rate Limiting                  │
            │  • Input Validation                      │
            │  • Request Tracking                      │
            └────┬──────────────────────────┬──────────┘
                 ↓                          ↓
        ┌─────────────────┐      ┌──────────────────────┐
        │ Upload Handler  │      │ Approval Handler     │
        │ ┌─────────────┐ │      │ ┌────────────────┐   │
        │ │Extract Text │ │      │ │Queue Task      │   │
        │ │Call Agents  │ │      │ │(async)         │   │
        │ │Parse JSON   │ │      │ │Enqueue          │   │
        │ │Save to DB   │ │      │ │Return 202      │   │
        │ └─────────────┘ │      │ └────────────────┘   │
        └────┬────────────┘      └──────────┬───────────┘
             ↓                              ↓
        ┌──────────────────────────────────────────────┐
        │         QUEUE SYSTEM (Redis/RabbitMQ)       │
        │  • Task buffering                            │
        │  • Priority queue                            │
        │  • Retry mechanism (exponential backoff)     │
        │  • Dead letter queue (failed tasks)          │
        └────┬─────────────────────────────────────────┘
             ↓
        ┌──────────────────────────────────────────────┐
        │     TASK PROCESSOR (Worker Pool)             │
        │  • Process Phase 1 creation                  │
        │  • Fallback if Phase 1 not found             │
        │  • Retry with circuit breaker                │
        │  • Emit events on completion                 │
        └────┬───────────────────────────────┬─────────┘
             ↓                               ↓
        ┌─────────────────┐      ┌──────────────────────┐
        │ DATABASE LAYER  │      │ EVENT BUS            │
        │ • marketplace   │      │ • plan.phase1.created│
        │   _plans        │      │ • plan.phase1.failed │
        │ • tasks         │      │ • task.created       │
        │ • job_queue     │      │ • task.failed        │
        │ • recovery_logs │      └──────────────────────┘
        └──────┬──────────┘              ↓
               ↓                    ┌──────────────────┐
        ┌──────────────────────┐   │ NOTIFICATION SYSTEM
        │ MONITORING &         │   │ • Webhooks (Slack)
        │ DIAGNOSTICS LAYER    │   │ • Email alerts
        │ • Health checks      │   │ • Dashboard updates
        │ • Stuck detection    │   └──────────────────┘
        │ • Recommendations    │
        │ • Metrics            │
        └──────────────────────┘
```

### 2.3 Component Deep-Dive

#### 2.3.1 Queue System (Redis Recommended)

**Why Redis?**
- In-memory for speed (< 1ms latency)
- Built-in retry mechanism
- Pub/Sub for notifications
- Cost-effective (~$5/month for small deployments)
- BullMQ library provides abstraction

**Queue Types:**
```typescript
// Analysis Phase 1 Creation Queue
interface Phase1Job {
  planId: string;
  channels: string[];
  createdAt: string;
  attempts: number;
  maxAttempts: 3;
  backoffDelay: exponential; // 1s → 5s → 30s
}

// Task Assignment Queue
interface TaskAssignmentJob {
  taskIds: string[];
  planId: string;
  priority: 'high' | 'normal' | 'low';
}

// Recovery Queue (for failed jobs)
interface RecoveryJob {
  failedJobId: string;
  failureReason: string;
  recoveryAttempt: number;
}
```

**Implementation:**
```bash
# Install dependencies
npm install bullmq redis

# Start Redis (local development)
docker run -p 6379:6379 redis:7-alpine

# Or use managed service (production)
# Redis Cloud, AWS ElastiCache, Digital Ocean, etc.
```

#### 2.3.2 Task Processor (Worker)

```typescript
// Worker pattern with BullMQ
import { Worker } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  // Add auth if needed
});

const phase1Worker = new Worker(
  'phase1-creation',
  async (job) => {
    try {
      const { planId, channels } = job.data;

      // Process with retry logic
      const taskIds = await createPhase1TasksWithRetry(planId);

      // Emit success event
      await redis.publish('phase1.created', JSON.stringify({
        planId,
        taskIds,
        timestamp: new Date().toISOString(),
      }));

      return { success: true, taskIds };
    } catch (error) {
      // Emit failure event
      await redis.publish('phase1.failed', JSON.stringify({
        planId: job.data.planId,
        error: error.message,
        attempt: job.attemptsMade,
        timestamp: new Date().toISOString(),
      }));

      // Automatic retry (3 times with exponential backoff)
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10, // Process 10 jobs in parallel
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000, // 2s initial delay
      },
      removeOnComplete: true,
      removeOnFail: false, // Keep failed jobs for analysis
    },
  }
);

phase1Worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

phase1Worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed: ${err.message}`);
  // Trigger recovery mechanism
  enqueuRecoveryJob(job);
});
```

#### 2.3.3 Fallback Mechanism (Automatic Phase 1 Generation)

```typescript
// Enhanced createPhase1Tasks with fallback
export async function createPhase1TasksWithFallback(planId: string): Promise<string[]> {
  const plan = await fetchPlan(planId);
  let phase1 = plan.plan_data.phases.find(p => p.number === 1);

  // FALLBACK: Generate Phase 1 if not found
  if (!phase1) {
    console.warn(`⚠️ Phase 1 missing for plan ${planId}. Auto-generating...`);

    phase1 = generatePhase1FromOpportunities(
      plan.plan_data.opportunities,
      plan.channels
    );

    console.log(`✅ Generated Phase 1 with ${phase1.tasks.length} tasks`);
  }

  // CIRCUIT BREAKER: Check if generation is failing repeatedly
  const failureCount = await getRecentFailureCount(planId);
  if (failureCount > 3) {
    console.error(`🛑 Circuit breaker triggered for plan ${planId}`);
    throw new Error('Circuit breaker: Too many failures');
  }

  // Create tasks
  const taskIds = await createTasksFromPhase1(phase1, plan);
  return taskIds;
}

// Helper: Generate Phase 1 from opportunities
function generatePhase1FromOpportunities(
  opportunities: AnalysisOpportunity[],
  channels: string[]
): AnalysisPhase {
  const highPriorityOpps = opportunities
    .filter(opp => opp.priority === 'alta')
    .slice(0, 5);

  return {
    number: 1,
    name: 'Fase 1 - Otimizações de Impacto Rápido',
    weeks: 'Semanas 1-4',
    tasks: highPriorityOpps.map(opp => `${opp.title}: ${opp.what}`),
    investment: 'Equipe interna, ferramentas básicas',
    expectedImpact: '15-20% de melhoria em KPIs',
  };
}
```

#### 2.3.4 Circuit Breaker Pattern

```typescript
// Prevent cascading failures
class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  private readonly failureThreshold = 5;
  private readonly successThreshold = 2;
  private readonly resetTimeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        console.log('🟢 Circuit breaker CLOSED (recovered)');
        this.state = 'closed';
        this.successCount = 0;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      console.log('🔴 Circuit breaker OPEN');
      this.state = 'open';
      setTimeout(() => {
        console.log('🟡 Circuit breaker HALF-OPEN (testing)');
        this.state = 'half-open';
        this.failureCount = 0;
      }, this.resetTimeout);
    }
  }
}

// Usage
const breaker = new CircuitBreaker();
try {
  await breaker.execute(() => createPhase1Tasks(planId));
} catch (error) {
  if (error.message === 'Circuit breaker is OPEN') {
    // Fallback to manual recovery
    await queueRecoveryJob(planId);
  }
}
```

#### 2.3.5 Monitoring & Diagnostics

```typescript
// Health check endpoint
export async function getSystemHealth(): Promise<HealthReport> {
  const redis = new Redis();
  const supabase = createSupabaseServerClient();

  const [queueStats, dbStats] = await Promise.all([
    getQueueStats(redis),
    getDbStats(supabase),
  ]);

  const stuckPatterns = await detectStuckPatterns(supabase);
  const recommendations = generateRecommendations(stuckPatterns);

  return {
    timestamp: new Date().toISOString(),
    overall_status: determineStatus(stuckPatterns),
    queue: {
      waiting: queueStats.waiting,
      active: queueStats.active,
      completed: queueStats.completed,
      failed: queueStats.failed,
      health: queueStats.failed === 0 ? 'healthy' : 'unhealthy',
    },
    database: {
      pending_plans: dbStats.pendingCount,
      plans_without_phase1: dbStats.missingPhase1Count,
      old_pending_tasks: dbStats.oldPendingCount,
    },
    stuck_patterns: stuckPatterns,
    recommendations,
  };
}

// Metrics to track
interface SystemMetrics {
  // Queue metrics
  avg_queue_delay: number; // ms
  p99_queue_delay: number; // ms
  job_completion_rate: number; // %
  job_failure_rate: number; // %

  // Business metrics
  avg_phase1_creation_time: number; // ms
  plans_recovered_today: number;
  stalled_plans: number;

  // System health
  circuit_breaker_state: 'closed' | 'open' | 'half-open';
  redis_connectivity: boolean;
  db_connectivity: boolean;
}
```

---

## PART 3: IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2) — **Current State + v1 (Already Done)**
- ✅ Fallback Phase 1 generation
- ✅ Recovery endpoint
- ✅ Diagnostics API
- 📊 Metrics collection starting

### Phase 2: Queue System (Week 3-4) — **Recommended Next**
- [ ] Set up Redis (local + cloud)
- [ ] Implement BullMQ worker pattern
- [ ] Migrate Phase 1 creation to queue
- [ ] Add retry logic with exponential backoff
- [ ] Implement circuit breaker
- [ ] Event-driven notifications

### Phase 3: Monitoring (Week 5) — **Recommended**
- [ ] Real-time health dashboard
- [ ] Alert webhooks (Slack/email)
- [ ] Metrics collection (Prometheus-ready)
- [ ] SLA tracking

### Phase 4: Optimization (Week 6+) — **Optional/Future**
- [ ] ML-based failure prediction
- [ ] Adaptive timeout tuning
- [ ] Cost optimization (Redis sizing)
- [ ] Multi-region failover

---

## PART 4: TECHNOLOGY DECISIONS

### Decision 1: Queue System

**Options:**
| Option | Pros | Cons | Recommendation |
|--------|------|------|---|
| **Redis (BullMQ)** | Fast, simple, built-in retry | Requires Redis management | ✅ **RECOMMENDED** |
| **PostgreSQL** | Built-in (Supabase), simpler | Slower (~10ms latency), overkill | ⚠️ If cost is critical |
| **RabbitMQ** | Enterprise, durable | Complex setup, overkill | ❌ Too heavy |
| **n8n Workflows** | Visual, managed | Vendor lock-in, slower | ⚠️ For workflows only |

**Recommendation: Redis + BullMQ**
- Cost: $5-20/month (managed Redis Cloud)
- Latency: <1ms (vs 10ms PostgreSQL)
- Complexity: Medium (straightforward setup)
- Scalability: Handles 100K+ jobs/sec

### Decision 2: Monitoring

**Options:**
| Option | Pros | Cons | Recommendation |
|--------|------|------|---|
| **Prometheus + Grafana** | Open-source, powerful | Self-hosted overhead | ✅ **RECOMMENDED** |
| **DataDog** | Managed, easy | Expensive ($$$) | ⚠️ If budget allows |
| **New Relic** | Managed, simpler | Expensive | ⚠️ If budget allows |
| **Custom Dashboard** | Full control | Time-intensive | ❌ Not recommended |

**Recommendation: Prometheus + Grafana**
- Cost: Free (self-hosted) or ~$50/month (managed)
- Effort: Medium (standard setup)
- Scalability: Handles millions of metrics

### Decision 3: Notification System

**Options:**
| Channel | Latency | Reliability | Recommendation |
|---------|---------|-------------|---|
| **Slack Webhooks** | < 1s | 99.99% | ✅ **For alerts** |
| **Email** | 1-5min | 99% | ✅ **For summaries** |
| **SMS** | < 30s | 99.9% | ⚠️ Only critical |
| **PagerDuty** | < 1s | 99.99% | ✅ **For on-call** |

**Recommendation: Slack (primary) + Email (fallback)**

---

## PART 5: CONFIGURATION & SETUP

### 5.1 Environment Variables

```bash
# Redis
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=***
REDIS_DB=0

# Queue Configuration
QUEUE_CONCURRENCY=10
QUEUE_MAX_ATTEMPTS=3
QUEUE_BACKOFF_DELAY=2000

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
GRAFANA_ADMIN_PASSWORD=***

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
SLACK_ALERT_CHANNEL=#marketplace-alerts
PAGERDUTY_KEY=***

# Feature Flags
ENABLE_QUEUE_PROCESSING=true
ENABLE_CIRCUIT_BREAKER=true
ENABLE_AUTO_RECOVERY=true
```

### 5.2 Database Schema Changes

```sql
-- New table for job queue metadata (for audit trail)
CREATE TABLE IF NOT EXISTS job_queue_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES marketplace_plans(id),
  job_id VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  queue_name VARCHAR NOT NULL,
  attempts INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);

-- Index for queries
CREATE INDEX idx_queue_history_plan ON job_queue_history(plan_id);
CREATE INDEX idx_queue_history_status ON job_queue_history(status);

-- Metrics table
CREATE TABLE IF NOT EXISTS marketplace_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR NOT NULL,
  metric_value FLOAT,
  timestamp TIMESTAMP DEFAULT now(),
  labels JSONB -- For dimensions (channel, status, etc)
);

CREATE INDEX idx_metrics_name_timestamp ON marketplace_metrics(metric_name, timestamp);
```

---

## PART 6: DEPLOYMENT STRATEGY

### 6.1 Local Development

```bash
# 1. Start Redis
docker-compose up redis

# 2. Run worker
npm run worker:phase1

# 3. Test queue
curl -X POST http://localhost:3000/api/test/enqueue-phase1 \
  -H "Content-Type: application/json" \
  -d '{"planId": "test-123"}'

# 4. Monitor
redis-cli MONITOR
```

### 6.2 Staging Deployment

```bash
# 1. Deploy to Railway or AWS
# 2. Use managed Redis (Redis Cloud, AWS ElastiCache)
# 3. Enable monitoring (Prometheus scrape config)
# 4. Test with production data sample
```

### 6.3 Production Deployment

```bash
# 1. Blue-green deployment (zero downtime)
# 2. Health checks enabled
# 3. Auto-scaling configured
# 4. Alerts configured
# 5. Monitoring dashboards live
# 6. Runbooks prepared
```

---

## PART 7: PERFORMANCE TARGETS

| Metric | Current | Target | SLA |
|--------|---------|--------|-----|
| Phase 1 creation time | N/A (manual) | <5s (p99) | 99% |
| Job queue latency | N/A | <100ms | 99.9% |
| Stuck plan detection | 4-8 hours | <5 seconds | Auto-detect |
| Recovery time | 30+ minutes | <30 seconds | Auto-recover |
| System uptime | 95% | 99.9% | SLA-backed |
| Cost (monthly) | N/A | $50-100 | Budget |

---

## PART 8: RISK MITIGATION

### 8.1 Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Redis downtime | Queue stops | Fallback to sync processing + alert |
| Queue overflow | Memory issues | Auto-scale workers + size monitoring |
| Agent failures | Phase 1 missing | Fallback generation + circuit breaker |
| Database slowness | Latency | Connection pooling + query optimization |
| Network issues | Job loss | Persistent queue + retry mechanism |

### 8.2 Disaster Recovery

```typescript
// If Redis fails, fallback to synchronous processing
const processPhase1 = async (planId: string) => {
  try {
    // Try queue first
    await redis.enqueue('phase1-creation', { planId });
  } catch (error) {
    // Fallback: process synchronously
    console.warn('⚠️ Redis unavailable, processing synchronously');
    await createPhase1TasksWithFallback(planId);
  }
};
```

---

## PART 9: SUCCESS METRICS

### How to Measure Success

1. **Reliability**: Zero stalled plans in production (target: 30 days)
2. **Performance**: 99% of Phase 1 jobs complete in <5s
3. **Observability**: 100% of failures detected automatically
4. **Cost**: <$100/month for infrastructure
5. **Team Impact**: 0 manual interventions needed

---

## PART 10: NEXT ACTIONS

### Immediate (This Week)
- [ ] Review this design with team
- [ ] Estimate effort (Story point sizing)
- [ ] Get approval to proceed

### Short-term (Next 2 Weeks)
- [ ] Set up Redis (local + cloud option)
- [ ] Implement BullMQ worker
- [ ] Add queue job tracking
- [ ] Test with load (100+ concurrent jobs)

### Medium-term (Weeks 3-4)
- [ ] Deploy to staging
- [ ] Set up monitoring
- [ ] Configure alerts
- [ ] Load testing (1000+ jobs)

### Long-term (Weeks 5+)
- [ ] Production rollout (canary → full)
- [ ] Optimization based on metrics
- [ ] ML-based prediction (future)

---

## APPENDIX A: Code Examples

### A.1 Worker Setup

```typescript
// app/workers/phase1.worker.ts
import { Worker, Queue } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const phase1Queue = new Queue('phase1-creation', { connection: redis });

export const phase1Worker = new Worker(
  'phase1-creation',
  async (job) => {
    const { planId } = job.data;
    console.log(`[Worker] Processing Phase 1 for plan ${planId}`);

    try {
      const taskIds = await createPhase1TasksWithFallback(planId);
      console.log(`[Worker] ✅ Created ${taskIds.length} tasks`);
      return { taskIds };
    } catch (error) {
      console.error(`[Worker] ❌ Failed:`, error);
      throw error;
    }
  },
  { connection: redis }
);

// Usage: Enqueue job
export async function enqueuePhase1Job(planId: string) {
  await phase1Queue.add('create', { planId }, {
    priority: 10,
    removeOnComplete: true,
    removeOnFail: false,
  });
}
```

### A.2 API Endpoint

```typescript
// app/api/marketplace/analysis/[id]/approve/route.ts
export async function PATCH(request: NextRequest, { params }) {
  const body = await request.json();
  const { action } = body;

  if (action === 'approve') {
    // Update status
    await updatePlanStatus(params.id, 'approved');

    // Queue Phase 1 job (async, non-blocking)
    await enqueuePhase1Job(params.id);

    // Return immediately
    return NextResponse.json({
      status: 'approved',
      message: 'Plan approved. Phase 1 creation queued.',
    }, { status: 202 }); // Accepted (async processing)
  }
}
```

---

## APPENDIX B: Monitoring Queries

### Prometheus

```promql
# Queue health
rate(bullmq_jobs_completed_total[5m])
rate(bullmq_jobs_failed_total[5m])

# P99 latency
histogram_quantile(0.99, rate(bullmq_job_duration_seconds_bucket[5m]))

# Circuit breaker status
bullmq_circuit_breaker_state{state="open"}
```

---

## APPENDIX C: Slack Alert Examples

```json
{
  "text": "🚨 High job failure rate detected",
  "attachments": [
    {
      "color": "danger",
      "fields": [
        {"title": "Failure Rate", "value": "5%", "short": true},
        {"title": "Failed Jobs", "value": "12", "short": true},
        {"title": "Recommendation", "value": "Check agent connectivity"}
      ]
    }
  ]
}
```

---

## CONCLUSION

This **Marketplace Resilience System v2.0** provides:

✅ **Automatic Recovery** — Zero manual intervention
✅ **Real-time Visibility** — Know issues as they happen
✅ **Production-Grade** — 99.9% SLA achievable
✅ **Cost-Effective** — $50-100/month infrastructure
✅ **Scalable** — Handles 100K+ jobs/sec

**Ready for implementation. Estimated effort: 2-3 weeks for full rollout.**

---

— Aria, arquitetando o futuro 🏗️
