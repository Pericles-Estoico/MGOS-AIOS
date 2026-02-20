# 📦 Marketplace Orchestration — Deployment Guide

**Production Readiness Checklist**
**Updated:** February 2026

---

## Pre-Deployment Checklist

### Environment Variables

Create `.env.local` with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# NextAuth Configuration (for session management)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-here

# Marketplace Agent Tokens (secure these!)
MARKETPLACE_AMAZON_TOKEN=marketplace-amazon-secret123
MARKETPLACE_SHOPEE_TOKEN=marketplace-shopee-secret456
MARKETPLACE_MERCADOLIVRE_TOKEN=marketplace-mercadolivre-secret789
MARKETPLACE_SHEIN_TOKEN=marketplace-shein-secret012
MARKETPLACE_TIKTOKSHOP_TOKEN=marketplace-tiktokshop-secret345
MARKETPLACE_KAWAY_TOKEN=marketplace-kaway-secret678
```

### Database Setup

#### 1. Create `marketplace_tasks` Table

```sql
CREATE TABLE IF NOT EXISTS marketplace_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace TEXT NOT NULL CHECK (marketplace IN ('amazon', 'shopee', 'mercadolivre', 'shein', 'tiktokshop', 'kaway')),
  created_by TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('optimization', 'best-practice', 'scaling', 'analysis')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_approval', 'approved', 'in_progress', 'completed', 'rejected')),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  assigned_to UUID,
  approved_by UUID,
  completed_by UUID,

  estimated_hours NUMERIC NOT NULL,
  actual_hours NUMERIC,

  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  rejection_reason TEXT,
  completion_notes TEXT,

  created_at_index TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (created_at) STORED
);

-- Create indexes for common queries
CREATE INDEX idx_marketplace_tasks_status ON marketplace_tasks(status);
CREATE INDEX idx_marketplace_tasks_marketplace ON marketplace_tasks(marketplace);
CREATE INDEX idx_marketplace_tasks_created_by ON marketplace_tasks(created_by);
CREATE INDEX idx_marketplace_tasks_approved_by ON marketplace_tasks(approved_by);
CREATE INDEX idx_marketplace_tasks_assigned_to ON marketplace_tasks(assigned_to);
CREATE INDEX idx_marketplace_tasks_status_submitted ON marketplace_tasks(status, submitted_at);
CREATE INDEX idx_marketplace_tasks_completed_at ON marketplace_tasks(completed_at);
CREATE INDEX idx_marketplace_tasks_marketplace_status ON marketplace_tasks(marketplace, status);

-- Enable RLS
ALTER TABLE marketplace_tasks ENABLE ROW LEVEL SECURITY;
```

#### 2. Set Up Row-Level Security (RLS) Policies

```sql
-- Allow service role to do everything (API backend)
CREATE POLICY "Allow service role" ON marketplace_tasks
  AS PERMISSIVE FOR ALL
  USING (auth.role() = 'service_role');

-- Allow authenticated users to read all tasks
CREATE POLICY "Allow authenticated users to read" ON marketplace_tasks
  AS PERMISSIVE FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow admins to approve/assign
CREATE POLICY "Allow admins to update" ON marketplace_tasks
  AS PERMISSIVE FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND
     (SELECT role FROM public.user_profile WHERE id = auth.uid()) = 'admin')
  );

-- Allow assigned users to complete their tasks
CREATE POLICY "Allow assigned user to complete" ON marketplace_tasks
  AS PERMISSIVE FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND assigned_to = auth.uid())
  )
  WITH CHECK (status = 'completed');
```

#### 3. Create Daily Stats Function

```sql
CREATE OR REPLACE FUNCTION get_marketplace_daily_stats()
RETURNS TABLE (
  marketplace TEXT,
  created BIGINT,
  approved BIGINT,
  in_progress BIGINT,
  completed BIGINT,
  avg_completion_time NUMERIC
) AS $$
  SELECT
    t.marketplace,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END)::BIGINT as created,
    COUNT(CASE WHEN t.status = 'approved' THEN 1 END)::BIGINT as approved,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END)::BIGINT as in_progress,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::BIGINT as completed,
    AVG(EXTRACT(EPOCH FROM (t.completed_at - t.started_at))/3600)::NUMERIC as avg_completion_time
  FROM marketplace_tasks t
  WHERE DATE(t.created_at) = CURRENT_DATE
  GROUP BY t.marketplace
  ORDER BY t.marketplace;
$$ LANGUAGE SQL STABLE;
```

### Application Configuration

#### 1. Update Type Mappings

If your database column names differ from TypeScript types, update `TaskManager.ts`:

```typescript
// Database columns use snake_case, TypeScript uses camelCase
// Supabase auto-converts with --snake_case_to_camel_case flag, or map manually:

interface DBMarketplaceTask {
  id: string;
  created_by: string;    // Database
  submitted_at?: string;
}

// TypeScript type uses camelCase (already defined in types.ts)
interface MarketplaceTask {
  createdBy: string;     // TypeScript
  submittedAt?: string;
}
```

#### 2. Configure Authentication

In `lib/auth.ts`:

```typescript
import NextAuth from 'next-auth';
import { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    // Your auth provider (GitHub, Google, etc.)
  ],
  callbacks: {
    async session({ session, token }) {
      // Add role to session
      session.user.role = token.role; // 'admin' or 'user'
      return session;
    }
  },
  session: {
    strategy: 'database', // or 'jwt' depending on your setup
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }
};

export default NextAuth(authOptions);
```

---

## Deployment Environments

### Development

```bash
# Start development server
npm run dev

# Test API endpoints
curl http://localhost:3000/api/orchestration/tasks

# Run tests
npm test

# Check types
npm run typecheck

# Lint code
npm run lint
```

### Staging

```bash
# Deploy to staging environment
# Set environment variables in staging config
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=staging-key

# Build
npm run build

# Run production mode locally
npm run start

# Verify endpoints are working
curl https://staging.yourdomain.com/api/orchestration/tasks
```

### Production

#### Option 1: Vercel Deployment

```bash
# Connect GitHub repo to Vercel
# Vercel automatically deploys on push to main

# Set environment variables in Vercel dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXTAUTH_URL
# - NEXTAUTH_SECRET
# - MARKETPLACE_*_TOKEN (all 6 agent tokens)

# Monitor deployments
vercel logs --follow

# Check production endpoint
curl https://yourdomain.com/api/orchestration/tasks
```

#### Option 2: Self-Hosted (Docker)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Build app
COPY . .
RUN npm run build

# Expose port
EXPOSE 3000

# Run
CMD ["npm", "start"]
```

```bash
# Build image
docker build -t marketplace-orchestration:latest .

# Run container
docker run -d \
  --name orchestration \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  -e SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY \
  marketplace-orchestration:latest

# Check logs
docker logs -f orchestration
```

---

## Post-Deployment

### 1. Verify Database Connection

```bash
# Test from Next.js API route
curl http://localhost:3000/api/orchestration/tasks

# Should return JSON with empty array (or existing tasks)
# {
#   "tasks": [],
#   "count": 0,
#   "offset": 0,
#   "limit": 50
# }
```

### 2. Test Authentication

```bash
# Create test admin user in Supabase
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('admin@example.com', ..., now());

# Create user profile with admin role
INSERT INTO public.user_profile (id, role)
VALUES ('<user-id>', 'admin');

# Test login
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -d "email=admin@example.com&password=..."
```

### 3. Test Marketplace Agent Token

```bash
# Create a test task with agent token
curl -X POST http://localhost:3000/api/orchestration/tasks \
  -H "Authorization: Bearer marketplace-amazon-secret123" \
  -H "Content-Type: application/json" \
  -d '{
    "marketplace": "amazon",
    "title": "Test task",
    "description": "Testing deployment",
    "category": "optimization",
    "priority": "high",
    "estimatedHours": 2,
    "createdBy": "marketplace-amazon"
  }'

# Should return 201 Created with task data
```

### 4. Monitor Logs

```bash
# View application logs
# Vercel: vercel logs --follow
# Self-hosted: docker logs -f orchestration
# Supabase: Check database logs in dashboard

# Look for errors like:
# - Connection refused (database down)
# - Auth errors (invalid tokens)
# - Type errors (schema mismatch)
```

### 5. Set Up Monitoring

#### Health Check Endpoint (Future)

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    const taskManager = new TaskManager();
    const stats = await taskManager.getDailyStats();

    return new Response(JSON.stringify({
      status: 'healthy',
      database: 'connected',
      stats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: String(error)
    }), {
      status: 503
    });
  }
}
```

#### Uptime Monitoring

```bash
# Monitor with UptimeRobot or similar
# GET https://yourdomain.com/api/health
# Alert if status != 200

# Expected response time: < 500ms
# Acceptable error rate: < 1%
```

---

## Scaling Considerations

### Current Capacity

```
Supabase Free Plan:
- 500MB database
- 50,000 monthly active users
- Supports ~5,000 tasks/day

Recommended for:
- Single team (< 20 members)
- < 500 tasks/month
- Development & small staging
```

### When to Scale Up

| Metric | Threshold | Action |
|--------|-----------|--------|
| Database Size | > 250MB | Upgrade Supabase plan |
| Tasks/Day | > 2,000 | Add database indexes, optimize queries |
| API Response Time | > 1s (p95) | Add caching, consider read replicas |
| Error Rate | > 2% | Investigate bottlenecks, scale horizontally |

### Scaling Strategy

1. **Vertical (Single Server):**
   - Upgrade Supabase to higher plan
   - Increase Node.js memory limit
   - Enable caching (Redis)

2. **Horizontal (Multiple Servers):**
   - Deploy to multiple Vercel instances
   - Use load balancer (Vercel handles)
   - Share session state (session store in Supabase)
   - Implement RPC-based statistics (already done)

3. **Database Optimization:**
   - Add read replicas for high-read workloads
   - Archive old tasks (> 6 months)
   - Partition by marketplace if > 10M tasks

---

## Security Hardening

### 1. Environment Variables

```bash
# ✅ Good: Use strong secrets
MARKETPLACE_AMAZON_TOKEN=$(openssl rand -base64 32)

# ❌ Bad: Weak or shared tokens
MARKETPLACE_AMAZON_TOKEN=test123
```

### 2. API Rate Limiting (Future)

```typescript
// Middleware to add rate limiting
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
});

export async function middleware(request: NextRequest) {
  const { success } = await ratelimit.limit(request.ip || 'anonymous');
  if (!success) return new NextResponse('Rate limited', { status: 429 });
}
```

### 3. Input Validation

Already implemented in API routes:
- Check required fields
- Type validation (marketplace enum, status enum)
- Length limits (title ≤ 255)
- Range validation (estimatedHours > 0)

### 4. Audit Logging

```sql
-- Create audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor UUID,
  resource_id UUID,
  timestamp TIMESTAMP DEFAULT now(),
  details JSONB
);

-- Log on task approval
CREATE TRIGGER log_task_approval
AFTER UPDATE ON marketplace_tasks
FOR EACH ROW
WHEN (OLD.status != NEW.status AND NEW.status = 'approved')
EXECUTE FUNCTION log_audit('approve_task');
```

---

## Troubleshooting Deployment Issues

### Issue: "Supabase not configured"

**Cause:** Missing environment variables

**Fix:**
```bash
# Check variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# If empty, add to .env.local
cat >> .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key-here
EOF

# Restart dev server
npm run dev
```

### Issue: 401 Unauthorized on Agent Token

**Cause:** Token mismatch or not set in environment

**Fix:**
```bash
# Verify token in environment
echo $MARKETPLACE_AMAZON_TOKEN

# Generate new token if needed
openssl rand -base64 32

# Update in .env.local and deployment platform
MARKETPLACE_AMAZON_TOKEN=new-generated-token
```

### Issue: RLS Policy Denying Access

**Cause:** User doesn't have `authenticated` role or missing policy

**Fix:**
```sql
-- Check if user is authenticated
SELECT role FROM auth.users WHERE id = auth.uid();

-- Grant permission
GRANT SELECT ON marketplace_tasks TO authenticated;

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'marketplace_tasks';

-- Create missing policy if needed
CREATE POLICY "Allow authenticated read" ON marketplace_tasks
  FOR SELECT USING (auth.role() = 'authenticated');
```

### Issue: Slow Queries on getDailyStats()

**Cause:** Missing indexes

**Fix:**
```sql
-- Add missing indexes
CREATE INDEX idx_marketplace_tasks_created_at ON marketplace_tasks(created_at);
CREATE INDEX idx_marketplace_tasks_status ON marketplace_tasks(status);

-- Verify query performance
EXPLAIN ANALYZE SELECT * FROM get_marketplace_daily_stats();
```

---

## Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Monitor error logs | Daily | DevOps |
| Backup database | Daily (Supabase auto) | Supabase |
| Review task metrics | Weekly | Product |
| Rotate agent tokens | Quarterly | Security |
| Update dependencies | Monthly | Dev |
| Performance audit | Monthly | DevOps |
| Disaster recovery test | Quarterly | DevOps |

---

## Rollback Procedure

If deployment causes issues:

### Vercel
```bash
# View deployment history
vercel deployments list

# Rollback to previous version
vercel deployments promote <deployment-id>

# Or manually revert and redeploy
git revert <commit-hash>
git push origin main
```

### Self-Hosted
```bash
# Stop current container
docker stop orchestration

# Remove problematic version
docker rm orchestration

# Run previous version
docker run -d --name orchestration <previous-image-id>
```

### Database Rollback
```bash
# Supabase maintains backups
# Contact support to restore from backup
# Typically available for 30 days
```

---

## Next Steps

1. ✅ Set up database schema (marketplace_tasks table)
2. ✅ Configure environment variables
3. ✅ Deploy to staging environment
4. ✅ Run integration tests
5. ✅ Deploy to production
6. ✅ Monitor for 24 hours
7. ✅ Enable marketplace agents
8. ✅ Set up monitoring & alerting

---

**Questions?** Refer to the full architecture guide or contact @architect (Aria).
