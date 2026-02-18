# 📊 MONITORING & ALERTS SETUP GUIDE - EPIC 2

**Purpose:** Track application health, detect errors early, and respond to issues proactively

**Time to Complete:** 1-2 hours
**Complexity:** Low-Medium
**Value:** High (Operational Excellence)

---

## 🎯 MONITORING STRATEGY

```
┌─────────────────────────────────────────────┐
│         PRODUCTION MONITORING STACK         │
├─────────────────────────────────────────────┤
│ Layer 1: Deployment Health (Vercel)         │
│ Layer 2: Application Errors (Vercel Logs)   │
│ Layer 3: Database Health (Supabase)         │
│ Layer 4: Performance Metrics (Optional)     │
│ Layer 5: Error Tracking (Optional - Sentry) │
└─────────────────────────────────────────────┘
```

---

## 🟢 LAYER 1: VERCEL DEPLOYMENT MONITORING

### Step 1.1: Access Vercel Dashboard
```
1. Go to: https://vercel.com/dashboard
2. Click on project: "mgos-aios"
3. You're in the project overview
```

### Step 1.2: Enable Vercel Alerts (Email)
```
Dashboard → Settings → Alerts
┌─────────────────────────────────────┐
│ ✓ Failed Deployments                │ Enable
│ ✓ Deployment Errors                 │ Enable
│ ✓ Build Warnings                    │ Enable
│ ✓ Function Errors (Serverless)      │ Enable
└─────────────────────────────────────┘

Recipient: your-email@example.com
```

**What you'll get:** Email notifications for:
- ❌ Failed builds
- ⚠️ Build warnings
- 🔴 Runtime errors
- ⏱️ Deployment timeouts

### Step 1.3: Monitor Recent Deployments
```
Dashboard → Deployments tab
┌─────────────────────────────────────┐
│ Deployment #1 | Ready  ✅ | 2m ago   │
│ Deployment #0 | Ready  ✅ | 1h ago   │
└─────────────────────────────────────┘

✅ Should show status "Ready" for all
```

### Step 1.4: Check Build Logs
```
Deployments → Click latest → Logs tab
┌─────────────────────────────────────┐
│ [14:23] Next.js build starting      │
│ [14:24] 22 routes compiled          │
│ [14:25] Build completed ✅          │
│ [14:26] Deployment ready            │
└─────────────────────────────────────┘

🟢 Look for: "Build completed" or "Deployment ready"
🔴 Alert if: "Build failed" or errors
```

---

## 🟦 LAYER 2: APPLICATION LOGS (Vercel)

### Step 2.1: Access Application Logs
```
Vercel Dashboard → Project → Logs → Runtime

Timeline:
- Real-time logs appear here
- Filter by:
  • Status (2xx, 4xx, 5xx)
  • Path (/api/tasks, etc.)
  • Method (GET, POST, etc.)
```

### Step 2.2: Monitor for Errors
```
🟢 GOOD Log Pattern:
[14:32:15.234Z] GET /api/tasks 401 45ms
[14:32:16.123Z] POST /api/evidence 201 128ms

🔴 BAD Log Pattern:
[14:35:22.456Z] GET /api/tasks 500 234ms ← DATABASE ERROR
[14:35:23.789Z] POST /api/tasks 504 30000ms ← TIMEOUT
```

### Step 2.3: Create Log Alerts
```
If seeing 500+ errors:
1. Note the error pattern
2. Check database connection
3. Review error message in logs
4. Alert to team if critical
```

**Common 500 Errors & Causes:**
| Error | Cause | Fix |
|-------|-------|-----|
| `database connection failed` | Supabase down or credentials wrong | Check Supabase status |
| `NEXT_PUBLIC_SUPABASE_URL undefined` | Missing env var | Check Vercel env vars |
| `RLS policy denied` | User not authorized | Check RLS policies |
| `relation "public.tasks" does not exist` | Database schema missing | Run migrations again |

---

## 🟪 LAYER 3: SUPABASE DATABASE MONITORING

### Step 3.1: Access Supabase Dashboard
```
1. Go to: https://app.supabase.com
2. Select project: "ytywuiyzulkvzsqfeghh"
3. Navigate to different monitoring views
```

### Step 3.2: Monitor Database Health
```
Supabase Dashboard → Database → Health
┌────────────────────────────────────────┐
│ ✅ Connected                            │
│ CPU Usage: 2%                           │
│ Memory: 234 MB / 1024 MB                │
│ Connections: 5 active / 100 max         │
│ Query Performance: Good                 │
└────────────────────────────────────────┘
```

**What to monitor:**
- ✅ CPU < 80%
- ✅ Memory < 80%
- ✅ Connections < 50 (of max 100)
- ✅ No query timeouts

### Step 3.3: Check Recent Queries
```
Supabase → SQL Editor → Logs (optional)

Shows:
- Query execution time
- Number of rows returned
- Any errors during execution

⚠️ Alert if:
- Queries taking > 1000ms
- Timeout errors
- Connection pool exhausted
```

### Step 3.4: Monitor RLS Policy Violations
```
Supabase → Logs → Auth logs
┌────────────────────────────────────────┐
│ [14:32] policy_violation               │
│ Table: tasks, User: 123, Action: read  │
│ Policy: "Users can only see own tasks" │
└────────────────────────────────────────┘

⚠️ Occasional RLS violations are normal
🔴 High rate = possible attack or bug
```

### Step 3.5: Set Supabase Alerts (Optional)
```
Supabase → Settings → Alerts

Available alerts:
[ ] Database CPU > 80%
[ ] Memory > 90%
[ ] Connection pool near limit
[ ] Query timeouts > 10 in 5min

Email notification setup available
```

---

## ⏱️ LAYER 4: PERFORMANCE METRICS

### Step 4.1: Vercel Analytics
```
Vercel Dashboard → Analytics tab

Metrics shown:
- Page load time (LCP - Largest Contentful Paint)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Requests per minute
- Data transfer
```

**Performance Targets:**
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| LCP | < 2.5s | > 4s |
| FID | < 100ms | > 300ms |
| CLS | < 0.1 | > 0.25 |
| 95th percentile response time | < 500ms | > 1000ms |

### Step 4.2: Database Query Performance
```
Supabase → SQL Editor (run sample queries)

Example: Check tasks query
SELECT * FROM tasks LIMIT 100;

⚠️ Alert if execution time > 1 second
🔴 Might need index on frequently queried columns
```

---

## 🔴 LAYER 5: ERROR TRACKING (OPTIONAL - Sentry Integration)

### When to Add Sentry
- ✅ After initial 24h in production
- ✅ When you want detailed error tracking
- ✅ Error grouping and trend analysis
- ✅ Source map support for debugging

### Integration Steps (Optional)
```bash
# 1. Sign up at sentry.io
# 2. Create new project for Next.js
# 3. Add to package.json:
npm install @sentry/nextjs

# 4. Create sentry.config.js
# 5. Add to vercel.json env vars
# 6. Deploy and monitor
```

**Benefits:**
- Detailed error stack traces
- Error trends and patterns
- User impact analysis
- Automatic source map upload

---

## 📋 MONITORING CHECKLIST - DAILY

### Morning (Start of Day)
- [ ] Check Vercel deployment status
- [ ] Review build logs from overnight
- [ ] Check for any error spikes
- [ ] Verify Supabase database health

### Afternoon (Mid-Day)
- [ ] Review error logs from morning
- [ ] Check API response times
- [ ] Monitor database query performance
- [ ] Validate no RLS policy errors

### Evening (End of Day)
- [ ] Summary of day's metrics
- [ ] Any issues to escalate?
- [ ] Performance trends
- [ ] Document any incidents

---

## 🚨 INCIDENT RESPONSE PROCEDURE

### If Error Rate Spikes 🔴

```
1. ASSESS (< 5 min)
   ├─ Check Vercel dashboard
   ├─ Check Supabase status
   ├─ Review error logs
   └─ Estimate impact (% of users)

2. DIAGNOSE (5-15 min)
   ├─ Is it a deployment issue?
   ├─ Is it a database issue?
   ├─ Is it an API issue?
   └─ Is it external service?

3. RESOLVE (15-30 min)
   ├─ Option A: Rollback deployment
   ├─ Option B: Restart database
   ├─ Option C: Scale resources
   └─ Option D: Hotfix and redeploy

4. VALIDATE (5-10 min)
   ├─ Error rate back to normal?
   ├─ API responses < 500ms?
   ├─ Database connections stable?
   └─ Users can access?

5. DOCUMENT
   └─ What happened, why, and how fixed
```

### Critical Thresholds
| Metric | Yellow ⚠️ | Red 🔴 |
|--------|----------|--------|
| Error Rate | > 1% | > 5% |
| Response Time | > 1s | > 5s |
| DB CPU | > 70% | > 90% |
| Database down | - | Yes |

---

## 📱 ALERT NOTIFICATIONS SETUP

### Email Alerts
```
Configured in:
✅ Vercel → Settings → Alerts → Email: your@email.com
✅ Supabase → Settings → Alerts (if enabled)
```

### Slack Integration (Optional)
```
For real-time alerts:
1. Vercel → Integrations → Slack
2. Authorize Slack workspace
3. Choose channel: #deployments or #alerts
4. Will get instant Slack notifications
```

### Custom Webhooks (Advanced)
```
For custom monitoring:
- Send Vercel deployment events to custom webhook
- Route to monitoring system
- Trigger automated responses
```

---

## 📊 MONITORING DASHBOARD (Recommended Setup)

Create a monitoring dashboard with:
```
Bookmarks Bar:
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Console: https://app.supabase.com
- Sentry (optional): https://sentry.io
```

---

## 📈 WEEKLY REVIEW

Every Friday, review:
1. **Error Trends:** Are errors decreasing?
2. **Performance:** Is app getting faster or slower?
3. **Scalability:** Are resources adequate?
4. **Security:** Any suspicious activity?
5. **User Impact:** Any customer complaints?

Create summary and share with team.

---

## 🎯 MONITORING COMPLETION CHECKLIST

- [ ] Vercel alerts configured (email)
- [ ] Can access Vercel logs
- [ ] Can access Supabase dashboard
- [ ] Bookmarked key monitoring pages
- [ ] Tested alert system (optional test)
- [ ] Daily monitoring routine established
- [ ] Team aware of incident response process
- [ ] Documentation reviewed

---

## ✅ MONITORING SETUP COMPLETE

Once all steps completed:
→ **Ready for STEP 3: Plan Epic 3**

---

**Created:** 2026-02-18
**Last Updated:** Setup Documentation
**Status:** Ready for Implementation
