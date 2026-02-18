# Story 1.1: Supabase Setup & Database Schema Implementation

**Status:** READY FOR HANDOFF
**Target:** @data-engineer (DEX)
**Epic:** Epic 1 - Foundation
**Date:** 2026-02-18
**Architecture Reference:** docs/architecture.md

---

## 📋 Story Summary

Implement the complete database schema for Digital TaskOps in Supabase PostgreSQL, including tables, relationships, RLS policies, and storage bucket configuration.

---

## ✅ Acceptance Criteria

### Database Implementation
- [ ] Create Supabase project (or connect to existing)
- [ ] Implement all 6 tables (users, tasks, evidence, qa_reviews, audit_logs, time_logs)
- [ ] All foreign keys and constraints properly defined
- [ ] Indexes created on critical columns (FK, filter columns)
- [ ] Cascade delete policies configured

### Row-Level Security (RLS)
- [ ] Enable RLS on all tables
- [ ] Implement RLS policies for each table:
  - [ ] users table - read own profile only
  - [ ] tasks table - based on role (admin sees all, head sees created/assigned, executor sees assigned)
  - [ ] evidence table - see evidence for visible tasks
  - [ ] qa_reviews table - QA role can review, others see results

### Storage Configuration
- [ ] Create Supabase Storage bucket: `evidence`
- [ ] Configure bucket for public read (CDN)
- [ ] Add RLS policies for storage (user can upload own evidence)
- [ ] Test file upload/download

### Audit Trail
- [ ] Create audit_logs table
- [ ] Set up PostgreSQL triggers to auto-log changes on tasks, evidence, qa_reviews
- [ ] Test audit trail captures all operations

### Environment & Documentation
- [ ] Update .env.example with Supabase credentials
- [ ] Document RLS policies in code comments
- [ ] Provide SQL migration scripts
- [ ] Test all queries return correct data based on role

### Testing
- [ ] Test RLS policies for each role (admin, head, executor, qa)
- [ ] Verify cascade delete works
- [ ] Check index performance on sample queries
- [ ] Confirm audit log captures all changes

---

## 📐 Database Schema Reference

**Full schema provided in:** `/docs/architecture.md` → "Backend Architecture" section

### Tables to Create (in order):

1. **users** - Extends Supabase auth.users
2. **tasks** - Core task entity
3. **evidence** - Task evidence (files/links)
4. **qa_reviews** - QA decisions
5. **audit_logs** - Complete audit trail
6. **time_logs** - Time tracking (optional, for V1 phase)

### Key Design Decisions:

- **Users table:** FK to auth.users(id) - single source of truth from Supabase Auth
- **Timestamps:** created_at, updated_at on all tables (use CURRENT_TIMESTAMP)
- **UUIDs:** Primary keys are UUID (use uuid_generate_v4())
- **Enums:** Use VARCHAR with CHECK constraints (not PG enums, more flexible)
- **RLS:** Enabled on all tables, enforced at DB level

### Critical Indexes:

```sql
-- Foreign keys (always index)
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);

-- Frequent filters
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Lookups
CREATE INDEX idx_evidence_task_id ON evidence(task_id);
CREATE INDEX idx_qa_reviews_task_id ON qa_reviews(task_id);
```

---

## 🔐 RLS Policies to Implement

### Example: tasks table

```sql
-- Policy 1: Admins see all tasks
CREATE POLICY "Admins see all tasks"
ON tasks FOR SELECT
USING (auth.jwt()->>'role' = 'admin');

-- Policy 2: Heads see created and assigned
CREATE POLICY "Heads see created"
ON tasks FOR SELECT
USING (created_by = auth.uid() OR auth.jwt()->>'role' = 'head');

-- Policy 3: Executors see assigned tasks
CREATE POLICY "Executors see assigned"
ON tasks FOR SELECT
USING (assigned_to = auth.uid());

-- Policy 4: Only creator/admin can update
CREATE POLICY "Update own or admin"
ON tasks FOR UPDATE
USING (created_by = auth.uid() OR auth.jwt()->>'role' = 'admin');
```

**All policies documented in:** `/docs/architecture.md`

---

## 📦 Supabase Storage Configuration

### Bucket: `evidence`

```
evidence/
└── {task-id}/
    ├── {filename}.png
    ├── {filename}.jpg
    └── {filename}.pdf
```

**RLS Policy for storage:**
```
Users can upload/download their own evidence only
```

---

## 🔗 Dependencies & Prerequisites

### Required
- Supabase account (https://supabase.com)
- PostgreSQL knowledge (basic SQL)
- Admin access to Supabase project

### Deliverables from Previous Work
- Architecture document (/docs/architecture.md) ← Reference for schema details
- Validation report (/docs/architecture/project-decisions/ARCHITECTURE-VALIDATION.md)

### Hands Off From
- @architect (Aria) - Architecture complete ✅

### Hands Off To
- @dev (DEX) - Next.js setup will use these tables
- @devops (GAGE) - CI/CD will test database migrations

---

## 📝 Technical Notes

### RLS + JWT Integration

Supabase RLS uses JWT claims to determine user role:
```typescript
// JWT payload includes:
{
  sub: "user-uuid",
  email: "user@example.com",
  role: "head",  // ← Used in RLS policies
  iat: 1708255200,
  exp: 1708341600
}

// RLS policy can access via:
auth.jwt()->>'role' = 'admin'
auth.uid() -- current user ID
```

**Important:** The `role` claim MUST be set correctly in NextAuth.js during login (see Story 1.5).

### Audit Trail Implementation

Use PostgreSQL triggers to auto-log changes:

```sql
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    entity_type, entity_id, action, changed_by,
    old_values, new_values, changed_at
  ) VALUES (
    'task', NEW.id, TG_OP, auth.uid(),
    to_jsonb(OLD), to_jsonb(NEW), NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_audit_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION log_task_changes();
```

### Testing RLS Policies

Use Supabase Studio or SQL client with different users:

```sql
-- Test as admin
SET request.jwt.claims = '{"role":"admin","sub":"admin-uuid"}';
SELECT * FROM tasks; -- Should see all

-- Test as executor
SET request.jwt.claims = '{"role":"executor","sub":"executor-uuid"}';
SELECT * FROM tasks; -- Should see only assigned
```

---

## 📚 Deliverables Checklist

**SQL Files to Create:**
- [ ] `supabase/migrations/01-schema.sql` - Create all tables
- [ ] `supabase/migrations/02-rls-policies.sql` - RLS policies
- [ ] `supabase/migrations/03-triggers.sql` - Audit trail triggers
- [ ] `supabase/migrations/04-seed-data.sql` - Test data (optional)

**Documentation:**
- [ ] Update docs/architecture.md with RLS implementation notes
- [ ] Create docs/DATABASE.md with setup instructions
- [ ] Provide .env.example with Supabase vars

**Testing:**
- [ ] SQL tests for RLS (use psql or Supabase Studio)
- [ ] Document test results in Story completion

---

## 🔄 Timeline

- **Start:** After Story 1.2 validation (now!)
- **Duration:** 4-6 hours (estimated)
- **Blocker for:** Story 1.4 & 1.5 (API route testing needs schema)
- **Parallel with:** Story 1.3 (UI design can proceed independently)

---

## 💬 Questions for @data-engineer

1. **Supabase Project:** Create new or use existing?
2. **Region:** Which Supabase region? (default: us-east-1)
3. **Backups:** Standard automatic daily backups OK?
4. **Connection Pooling:** Enable PgBouncer? (default: yes)
5. **Seed Data:** Should we seed test users/tasks for dev?

---

## 📞 Escalation

- **Architecture Questions:** Ask @architect (Aria)
- **API Integration Questions:** Ask @dev about expected query patterns
- **Deployment Questions:** Ask @devops about Supabase CI/CD

---

**Story Created By:** Aria (Architect)
**Date:** 2026-02-18
**Ready for Implementation:** ✅ YES

Next Step: Coordinate with @data-engineer for implementation start.
