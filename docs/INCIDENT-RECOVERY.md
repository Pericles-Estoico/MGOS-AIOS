# 🚨 Incident Recovery Guide — Marketplace Analysis Task Creation Failure

**Date:** 2026-02-24
**Status:** CRITICAL - Fixed
**Duration:** 24+ hours (2026-02-23 07:00 → 2026-02-24)

---

## 📋 Incident Summary

Marketplace analysis approvals were not creating Phase 1 tasks for 24+ hours. The root cause was that the BullMQ worker process was not being initialized on server startup.

### Root Cause

The worker was being initialized via a **client-side React component** (`QueueSystemInitializer`), which only runs when a user opens the app in a browser. In production (Vercel), if no user was actively using the app, the worker would never start.

### Files Affected

- `app/queue-system-initializer.tsx` — **REMOVED** (client-side, not production-safe)
- `instrumented.ts` — **CREATED** (server-side initialization via Next.js hooks)
- `app/layout.tsx` — **UPDATED** (removed client-side initializer)
- `app/api/admin/marketplace/recovery/route.ts` — **CREATED** (reprocessing endpoint)

---

## ✅ Fix Applied

### 1. Server-Side Worker Initialization

Created `instrumented.ts` at project root to initialize the queue system during Next.js server startup:

```typescript
export async function register() {
  // Only runs on server during startup
  const { initializeQueueSystem } = await import('@lib/queue/worker-init');
  await initializeQueueSystem();
}
```

**Benefits:**
- ✅ Worker starts when server boots, NOT when user opens browser
- ✅ Continuous processing even if app is idle
- ✅ Graceful shutdown on process signals (SIGTERM, SIGINT)

### 2. Removed Client-Side Initialization

Deleted `app/queue-system-initializer.tsx` which was unreliable in production.

### 3. Added Recovery Endpoint

Created `POST /api/admin/marketplace/recovery` for reprocessing stuck analyses:

```bash
# List stuck analyses
curl -X POST http://localhost:3000/api/admin/marketplace/recovery \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}'

# Reprocess specific analyses
curl -X POST http://localhost:3000/api/admin/marketplace/recovery \
  -H "Content-Type: application/json" \
  -d '{"action": "reprocess", "planIds": ["plan-id-1", "plan-id-2"]}'

# Reprocess ALL stuck analyses
curl -X POST http://localhost:3000/api/admin/marketplace/recovery \
  -H "Content-Type: application/json" \
  -d '{"action": "reprocess-all"}'
```

---

## 🔧 Recovery Procedure (Post-Deployment)

After deploying this fix to production:

### Step 1: Deploy Code Changes

```bash
git push origin main
# Vercel auto-deploys
```

### Step 2: List Stuck Analyses

```bash
curl -X POST https://www.sellerops.com.br/api/admin/marketplace/recovery \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}'
```

**Response:**
```json
{
  "status": "success",
  "stuckCount": 24,
  "ageHours": 24,
  "analyses": [...]
}
```

### Step 3: Reprocess All Stuck Analyses

```bash
curl -X POST https://www.sellerops.com.br/api/admin/marketplace/recovery \
  -H "Content-Type: application/json" \
  -d '{"action": "reprocess-all"}'
```

**Response:**
```json
{
  "status": "success",
  "message": "Reprocessed 24 of 24 analyses",
  "jobIds": ["job-id-1", "job-id-2", ...],
  "errors": []
}
```

### Step 4: Monitor Queue Processing

Check logs to verify jobs are processing:

```bash
# In Vercel logs
curl https://api.vercel.com/v6/deployments/[DEPLOYMENT_ID]/logs

# Look for:
# ✅ Phase 1 worker initialized on server
# 🔄 Processing job xxx...
# ✅ Job completed: xxx tasks created
```

### Step 5: Verify Completion

```bash
curl -X POST https://www.sellerops.com.br/api/admin/marketplace/recovery \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}'

# Should show: stuckCount: 0
```

---

## 🛠️ Environment Variables

For local development with Redis:

```bash
# .env.local
REDIS_HOST_DEV=localhost
REDIS_PORT_DEV=6379
ENABLE_QUEUE_WORKER=true  # Set to 'false' to disable for testing

# Production (set in Vercel dashboard)
REDIS_HOST_PROD=<your-redis-host>
REDIS_PORT_PROD=6379
REDIS_PASSWORD_PROD=<your-redis-password>
```

---

## 📊 Expected Timeline

| Phase | Duration | Action |
|-------|----------|--------|
| **Deploy** | 5 min | Push code to Vercel |
| **Startup** | 1 min | Worker initializes on server boot |
| **Recovery** | 5-10 min | Run recovery endpoint to reprocess 24+ analyses |
| **Processing** | 15-30 min | Worker processes all queued Phase 1 jobs |
| **Verification** | 5 min | Confirm all analyses have Phase 1 tasks |
| **Total** | 30-50 min | Complete incident recovery |

---

## ⚠️ Prevention (Future)

To prevent this from happening again:

1. **Monitoring**: Add alerts for queue depth and worker status
   - Queue depth > 10 for >5 minutes → Alert
   - Worker not initialized → Alert on server startup

2. **Health Checks**: Implement `/api/health/queue` endpoint
   ```typescript
   GET /api/health/queue
   Response: {
     "worker_status": "running|stopped|failed",
     "queue_depth": 5,
     "redis_connection": "connected|disconnected",
     "last_job": "2026-02-24T10:30:00Z"
   }
   ```

3. **Testing**: Add integration tests for queue initialization
   ```typescript
   test('Worker initializes on server startup', async () => {
     const { isQueueSystemReady } = await import('@lib/queue/worker-init');
     expect(isQueueSystemReady()).toBe(true);
   });
   ```

4. **Documentation**: Update onboarding to explain queue system startup

---

## 📚 References

- BullMQ Documentation: https://docs.bullmq.io/
- Next.js Instrumentation: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
- Redis Configuration: `/home/finaa/repos/MGOS-AIOS/lib/redis-client.ts`
- Queue System: `/home/finaa/repos/MGOS-AIOS/lib/queue/`

---

## 🆘 Troubleshooting

### Worker still not processing jobs

1. **Check Redis connection:**
   ```bash
   redis-cli ping
   # Should respond: PONG
   ```

2. **Check Vercel logs:**
   ```bash
   # Look for: "✅ Phase 1 worker initialized on server"
   ```

3. **Check environment variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Verify `REDIS_HOST_PROD`, `REDIS_PORT_PROD` are set

4. **Restart application:**
   - Vercel Dashboard → Deployments → Click latest → Click three-dots → Redeploy

### Recovery endpoint returns errors

1. **Check admin role:**
   ```bash
   # Ensure logged-in user has role='admin' in users table
   SELECT role FROM users WHERE email='your@email.com';
   ```

2. **Check plan data:**
   ```sql
   SELECT id, status, plan_data, phase1_tasks_created
   FROM marketplace_plans
   WHERE status='approved'
   LIMIT 5;
   ```

---

**Last Updated:** 2026-02-24
**Version:** 1.0
**Status:** Approved for Production ✅
