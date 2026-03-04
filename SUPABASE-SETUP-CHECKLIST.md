# ✅ Supabase Setup Checklist

**Project:** grxsyhmikuhqmffhipwt
**URL:** https://grxsyhmikuhqmffhipwt.supabase.co
**Status:** 🚀 Ready for Setup
**Date:** 2026-03-04

---

## 📋 Phase 1: Apply Migrations

### ⚡ Quick Path (Recommended)

- [ ] Open: `MIGRATIONS-ALL.sql` (na raiz do projeto)
- [ ] Select all: `Ctrl+A`
- [ ] Copy: `Ctrl+C`
- [ ] Go to: https://grxsyhmikuhqmffhipwt.supabase.co/dashboard/sql
- [ ] Paste: `Ctrl+V`
- [ ] Click: **RUN** button
- [ ] Wait: 2-3 minutes
- [ ] Verify: No red errors

**Expected result:** 29 migrations executed, 15+ tables created

---

### 🔍 Verification Queries

Run these in SQL Editor to confirm success:

```sql
-- Check tables created (should be ~15+)
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS enabled
SELECT COUNT(*) as rls_tables
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check users table
SELECT * FROM public.users LIMIT 1;
```

---

## 📂 Phase 2: Storage Configuration

### Create Evidence Bucket

- [ ] Go to: **Storage** → **Buckets** (left menu)
- [ ] Click: **New Bucket**
- [ ] Name: `evidence`
- [ ] Make Public: **Yes**
- [ ] Click: **Create**

### Set Storage RLS Policies

- [ ] Go to: `evidence` bucket → **Policies**
- [ ] Add policy: "For SELECT - Grant public read access"
- [ ] Add policy: "For INSERT - Only authenticated users"

---

## 🔐 Phase 3: Authentication Setup

### Enable Email Auth

- [ ] Go to: **Authentication** → **Providers**
- [ ] Ensure **Email** is enabled
- [ ] Confirm email: `Disabled` (for dev)
- [ ] Double confirm changes: `Disabled` (for dev)

### Create Test Users

- [ ] Go to: **Authentication** → **Users**
- [ ] Click: **Add user**
- [ ] Create these users:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | TestPass123! | admin |
| head@example.com | TestPass123! | head |
| executor@example.com | TestPass123! | executor |
| qa@example.com | TestPass123! | qa |

**For each user:**
1. Create user (password + email)
2. Go to User Details
3. In **User Metadata**, add:
```json
{
  "role": "admin"  // or head, executor, qa
}
```

---

## 🔌 Phase 4: Environment Variables

### Update `.env.local`

Verify these are already set (you already did this!):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://grxsyhmikuhqmffhipwt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_H_a3HBDnyUz25vvYKeXHlw_SKozAzwX
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Update `.env.example`

For version control (without secrets):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://grxsyhmikuhqmffhipwt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## 🧪 Phase 5: Test RLS Policies

### Test as Different Roles

In SQL Editor, run:

```sql
-- Test as Admin (should see all tasks)
SET request.jwt.claims = '{"role":"admin","sub":"admin-uuid"}';
SELECT COUNT(*) FROM tasks;

-- Test as Executor (should see only assigned)
SET request.jwt.claims = '{"role":"executor","sub":"executor-uuid"}';
SELECT COUNT(*) FROM tasks;

-- Reset
RESET request.jwt.claims;
```

---

## 🔄 Phase 6: Test Integration

### Start Development Server

```bash
npm run dev
```

### Test Supabase Connection

```bash
# In browser console:
curl http://localhost:3000/api/health
```

### Check API Routes

- [ ] `GET /api/auth/users` → Returns 4 test users
- [ ] `GET /api/tasks` → Returns tasks (RLS applied)
- [ ] `POST /api/tasks` → Create new task
- [ ] `GET /api/evidence` → Check evidence storage

---

## 🚨 Troubleshooting

### "Permission denied" Error

**Solution:** RLS policy too restrictive
```sql
-- Temporarily disable RLS (dev only)
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- Debug query
SELECT * FROM public.tasks;

-- Re-enable after fixing
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
```

### "Table does not exist"

**Solution:** A migration failed silently
- Re-run `MIGRATIONS-ALL.sql`
- Check for SQL errors (red text)
- Execute migrations individually if needed

### "Invalid JWT"

**Solution:** Token expired or wrong key
- Clear browser cookies
- Sign out and sign back in
- Verify JWT expiry: 1 hour (default)

---

## 📊 Database Schema Summary

### Core Tables (6)

| Table | Purpose | Rows |
|-------|---------|------|
| `users` | User profiles + roles | ~10 |
| `tasks` | Task units | ~100 |
| `evidence` | Proof of completion | ~200 |
| `qa_reviews` | QA decisions | ~50 |
| `audit_logs` | Change history | ~1000+ |
| `time_logs` | Time tracking | ~200 |

### Feature Tables (9+)

- `marketplace_channels` - Marketplace integrations
- `marketplace_jobs` - Job execution tracking
- `marketplace_subtasks` - Detailed task breakdown
- `notifications` - Email/push notifications
- `comments` - Real-time comments
- `saved_filters` - User-defined filters
- `sprints` - Sprint management
- `email_queue` - Email delivery queue
- `analytics_*` - Analytics data

---

## ✨ Next Steps

After completing all phases:

1. **Marketplace Integration** (Story 3.x)
   - Configure Amazon API
   - Configure Shopee API
   - Configure Mercado Livre API

2. **Email Notifications** (Story 4.1)
   - Setup Nodemailer
   - Email templates
   - Queue processing

3. **Real-time Features** (Story 4.2)
   - WebSocket setup
   - Real-time comments
   - Live notifications

4. **Analytics Dashboard** (Story 3.6)
   - Chart components
   - Data aggregation
   - Export functionality

---

## 🎯 Completion Checklist

- [ ] **Phase 1:** Migrations applied successfully
- [ ] **Phase 2:** Storage bucket created
- [ ] **Phase 3:** Test users created with roles
- [ ] **Phase 4:** Environment variables updated
- [ ] **Phase 5:** RLS policies verified working
- [ ] **Phase 6:** Next.js API integration tested
- [ ] **Security:** Old credentials regenerated
- [ ] **Commit:** Changes pushed to GitHub

---

## 📞 Support

If you encounter issues:

1. Check Supabase logs: **Dashboard → Logs**
2. Enable debug mode: `NEXT_PUBLIC_DEBUG=true`
3. Check database status: **Dashboard → Database**
4. Review RLS policies: **Dashboard → Auth → Policies**

---

**Estimated Time:** 30 minutes total
**Difficulty:** Medium
**Dependencies:** None (all tools included)

---

**Status:** 🚀 Ready to begin!
