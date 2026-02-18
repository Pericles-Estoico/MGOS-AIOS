# Digital TaskOps - Database Setup Guide

**Status:** Story 1.1 Implementation
**Date:** 2026-02-18
**Database:** PostgreSQL via Supabase

---

## 📋 Overview

This guide explains how to set up the Digital TaskOps database using Supabase (managed PostgreSQL). The database includes:

- **6 tables:** users, tasks, evidence, qa_reviews, audit_logs, time_logs
- **RLS policies:** Role-based access control (admin, head, executor, qa)
- **Audit trail:** Automatic logging of all data changes via triggers
- **Indexes:** Optimized for common queries

---

## 🚀 Quick Start (Local Development)

### Prerequisites

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Or use pnpm
pnpm install -g @supabase/cli

# Verify installation
supabase --version
```

### Initialize Local Supabase

```bash
# Go to project root
cd /home/finaa/repos/MGOS-AIOS

# Initialize Supabase project
supabase init

# This creates: supabase/ directory with config.toml
```

### Start Local Supabase

```bash
# Start Supabase locally (requires Docker)
supabase start

# Output will show:
# - API URL: http://localhost:54321
# - Postgres URL: postgresql://postgres:postgres@localhost:5432/postgres
# - Studio URL: http://localhost:54323
```

### Apply Migrations

```bash
# Run all migrations in order
supabase db push

# Or run individual migration
supabase db push supabase/migrations/01-schema.sql
```

### Verify Setup

```bash
# Connect to local database
psql postgresql://postgres:postgres@localhost:5432/postgres

# Check tables created
\dt public.*;

# Check RLS enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';
```

---

## 🌐 Production Setup (Supabase Cloud)

### 1. Create Supabase Project

Visit [supabase.com](https://supabase.com):

1. Sign up or log in
2. Click "New Project"
3. Enter project name: `digital-taskops`
4. Choose region: `us-east-1` (recommended for US-based teams)
5. Set a strong database password
6. Click "Create new project" (takes 2-3 minutes)

### 2. Get Connection Details

After project creation:

1. Go to Project Settings → Database
2. Copy the following:
   - **Host:** `project-ref.db.supabase.co`
   - **Port:** `5432`
   - **Database:** `postgres`
   - **User:** `postgres`
   - **Password:** Your chosen password

3. Also get from Project Settings → API:
   - **Project URL:** `https://project-ref.supabase.co`
   - **Anon Key:** (public, safe to expose)
   - **Service Role Key:** (keep secret!)

### 3. Update Environment Variables

Create `.env.local`:

```bash
# Copy from project settings
NEXT_PUBLIC_SUPABASE_URL=https://project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Only server-side (git-ignored)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:password@project-ref.db.supabase.co:5432/postgres
```

Update `.env.example` for documentation:

```bash
# .env.example (without secrets)
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres:password@[project-id].db.supabase.co:5432/postgres
```

### 4. Apply Migrations

#### Option A: Supabase CLI (Recommended)

```bash
# Link to cloud project
supabase link --project-ref project-ref

# Apply migrations
supabase db push

# Verify migrations in Supabase Studio:
# https://supabase.com/dashboard/project/project-ref/editor
```

#### Option B: SQL Editor (Supabase Dashboard)

1. Go to Supabase Dashboard → SQL Editor
2. Open each migration file:
   - `supabase/migrations/01-schema.sql`
   - `supabase/migrations/02-rls-policies.sql`
   - `supabase/migrations/03-triggers.sql`
   - `supabase/migrations/04-seed-data.sql`
3. Copy & paste content into SQL editor
4. Click "Run"

#### Option C: psql (Direct Connection)

```bash
# Connect directly
psql postgresql://postgres:password@project-ref.db.supabase.co:5432/postgres

# Run migrations
\i supabase/migrations/01-schema.sql
\i supabase/migrations/02-rls-policies.sql
\i supabase/migrations/03-triggers.sql
\i supabase/migrations/04-seed-data.sql
```

### 5. Create Storage Bucket

In Supabase Dashboard:

1. Go to Storage → Buckets
2. Click "New Bucket"
3. Name: `evidence`
4. Public bucket: **Yes** (for CDN access)
5. Click "Create bucket"

Set RLS Policy for storage bucket:

1. Go to `evidence` bucket → Policies
2. Click "New Policy"
3. Choose: `For SELECT - Grant public read access`
4. Click "Review"
5. For INSERT/UPDATE, create policy:

```sql
-- Users can upload evidence to their task folder
CREATE POLICY "Users upload evidence"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidence'
  AND auth.uid()::text = split_part(name, '/', 1)
);
```

---

## 🔐 Security Checklist

- [ ] RLS enabled on all tables
- [ ] Service role key never exposed in code
- [ ] Anon key used only in frontend
- [ ] JWT token expiry set (default: 1 hour)
- [ ] Database password is strong (Supabase requirement)
- [ ] SSL connection enforced (`sslmode=require`)
- [ ] Firewall rules configured (if needed)

---

## 🧪 Testing RLS Policies

### Local Testing

```bash
# Start Supabase with test data
supabase start
supabase db push

# Connect as different roles using Set Request Headers
# In Supabase Studio (http://localhost:54323):
# 1. Open SQL Editor
# 2. Set request headers before running query:
#    Header: X-User-Role = admin | head | executor | qa
#    Header: X-User-ID = user-uuid
```

### Test Queries

```sql
-- Test as Admin (should see all tasks)
SET request.jwt.claims = '{"role":"admin","sub":"admin-uuid"}';
SELECT * FROM tasks;

-- Test as Head (should see created + assigned)
SET request.jwt.claims = '{"role":"head","sub":"head-uuid"}';
SELECT * FROM tasks;

-- Test as Executor (should see only assigned)
SET request.jwt.claims = '{"role":"executor","sub":"executor-uuid"}';
SELECT * FROM tasks;

-- Test as QA (should see all for review)
SET request.jwt.claims = '{"role":"qa","sub":"qa-uuid"}';
SELECT * FROM tasks;
```

### Create Test Users

In Supabase Dashboard → Authentication → Users:

1. Click "Add user"
2. Create 4 test users:
   - admin@example.com (role: admin)
   - head@example.com (role: head)
   - executor@example.com (role: executor)
   - qa@example.com (role: qa)

3. Set each user's role via user metadata:

```javascript
// In your app code (backend only)
const { error } = await supabaseAdmin.auth.admin.updateUserById(
  userId,
  {
    user_metadata: {
      role: 'head'
    }
  }
);
```

---

## 📊 Schema Overview

### Tables

| Table | Purpose | Rows | RLS Enabled |
|-------|---------|------|-------------|
| users | User profiles | Hundreds | ✅ |
| tasks | Task units | Thousands | ✅ |
| evidence | Files/links | Thousands | ✅ |
| qa_reviews | QA decisions | Hundreds | ✅ |
| audit_logs | Change history | Tens of thousands | ✅ |
| time_logs | Time tracking | Thousands | ✅ |

### Indexes

- Foreign keys: 8 indexes
- Filter columns: 5 indexes
- Total: 13 indexes for performance

### Triggers

- Audit trail: 7 triggers (log all changes)
- Timestamps: 2 triggers (auto update created_at/updated_at)
- Total: 9 triggers

---

## 🔄 Migrations

Migration files are in `supabase/migrations/`:

| File | Purpose | Line Count |
|------|---------|-----------|
| 01-schema.sql | Create all tables | 200+ |
| 02-rls-policies.sql | RLS security policies | 250+ |
| 03-triggers.sql | Audit trail & timestamps | 150+ |
| 04-seed-data.sql | Test data (commented) | 100+ |

**Important:** Migrations are idempotent (safe to run multiple times).

---

## 🛠️ Common Tasks

### Add New User

```typescript
// From Next.js API route (server-side)
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'newuser@example.com',
  password: 'temporary-password',
  user_metadata: {
    role: 'executor'
  }
});
```

### Insert Task

```typescript
// From Next.js API route
const { data: task, error } = await supabase
  .from('tasks')
  .insert([
    {
      title: 'Task title',
      description: 'Description',
      assigned_to: 'user-uuid',
      due_date: '2026-02-20',
      frente: 'Conteúdo'
    }
  ])
  .select();
```

### Upload Evidence

```typescript
// From Next.js API route
const { data, error } = await supabase
  .storage
  .from('evidence')
  .upload(
    `task-id/${filename}`,
    file, // File blob
    {
      cacheControl: '3600',
      upsert: false
    }
  );
```

### Query with RLS

```typescript
// RLS policies automatically applied based on user's JWT
const { data: tasks, error } = await supabase
  .from('tasks')
  .select('*')
  .order('due_date'); // Returns only tasks user can access
```

---

## 🐛 Troubleshooting

### "Unable to connect to database"

```bash
# Check Supabase is running locally
supabase status

# Or check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### "Permission denied for schema public"

RLS might be too restrictive. Check:

```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables WHERE tablename = 'tasks';

-- Disable RLS temporarily (DEV ONLY)
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
```

### "Trigger function error"

Check trigger function syntax:

```sql
-- List all triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Recreate trigger
DROP TRIGGER IF EXISTS audit_tasks_insert ON public.tasks;
CREATE TRIGGER audit_tasks_insert
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();
```

### "No rows returned by RLS policy"

Test with service_role key:

```typescript
// Use service_role to bypass RLS (DEV ONLY)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabaseAdmin
  .from('tasks')
  .select('*'); // Sees all, bypasses RLS
```

---

## 📈 Performance Monitoring

### Check Query Performance

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM tasks
WHERE status = 'fazendo'
ORDER BY due_date;

-- Look for:
-- ✅ Index scans (good)
-- ❌ Seq scans on large tables (bad)
```

### Monitor Table Sizes

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🚀 Next Steps

1. **Local Development:**
   - [ ] Run `supabase start`
   - [ ] Apply migrations with `supabase db push`
   - [ ] Test RLS policies locally

2. **Production Deployment:**
   - [ ] Create Supabase project on supabase.com
   - [ ] Apply migrations to cloud database
   - [ ] Create storage bucket
   - [ ] Set environment variables in `.env.local`

3. **Integration:**
   - [ ] Story 1.5 - Implement API routes in Next.js
   - [ ] Story 1.4 - Build frontend components
   - [ ] Story 1.3 - Finalize UI design

---

## 📚 References

- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI Guide](https://supabase.com/docs/reference/cli)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Patterns](https://supabase.com/docs/guides/auth/row-level-security)

---

**Database Implementation:** ✅ Story 1.1
**Date:** 2026-02-18
**Status:** Ready for API implementation (Story 1.5)
