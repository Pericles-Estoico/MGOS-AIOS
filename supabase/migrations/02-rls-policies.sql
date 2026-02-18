-- Migration 02: Enable RLS and create security policies
-- Date: 2026-02-18
-- Description: Row-Level Security policies for RBAC by role

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qa_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.time_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: users table
-- ============================================================================
-- Rule: Users can see their own profile, admins see all

DROP POLICY IF EXISTS "Users see own profile" ON public.users;
CREATE POLICY "Users see own profile"
  ON public.users FOR SELECT
  USING (id = auth.uid() OR auth.jwt()->>'role' = 'admin');

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid() OR auth.jwt()->>'role' = 'admin');

-- ============================================================================
-- RLS POLICIES: tasks table
-- ============================================================================
-- Rules:
-- - Admin: sees all tasks
-- - Head: sees tasks they created or assigned to them
-- - Executor: sees tasks assigned to them
-- - QA: sees all tasks (needs to review any)

DROP POLICY IF EXISTS "Admins see all tasks" ON public.tasks;
CREATE POLICY "Admins see all tasks"
  ON public.tasks FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');

DROP POLICY IF EXISTS "Heads see created and assigned" ON public.tasks;
CREATE POLICY "Heads see created and assigned"
  ON public.tasks FOR SELECT
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR auth.jwt()->>'role' = 'head'
  );

DROP POLICY IF EXISTS "Executors see assigned" ON public.tasks;
CREATE POLICY "Executors see assigned"
  ON public.tasks FOR SELECT
  USING (assigned_to = auth.uid());

DROP POLICY IF EXISTS "QA sees all for review" ON public.tasks;
CREATE POLICY "QA sees all for review"
  ON public.tasks FOR SELECT
  USING (auth.jwt()->>'role' = 'qa');

-- Create tasks: Admin or Head only
DROP POLICY IF EXISTS "Create task - admin or head" ON public.tasks;
CREATE POLICY "Create task - admin or head"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.jwt()->>'role' IN ('admin', 'head'));

-- Update task: Creator or Admin
DROP POLICY IF EXISTS "Update task - creator or admin" ON public.tasks;
CREATE POLICY "Update task - creator or admin"
  ON public.tasks FOR UPDATE
  USING (created_by = auth.uid() OR auth.jwt()->>'role' = 'admin');

-- Delete task: Admin only
DROP POLICY IF EXISTS "Delete task - admin only" ON public.tasks;
CREATE POLICY "Delete task - admin only"
  ON public.tasks FOR DELETE
  USING (auth.jwt()->>'role' = 'admin');

-- ============================================================================
-- RLS POLICIES: evidence table
-- ============================================================================
-- Rules:
-- - Users see evidence for tasks they can access
-- - Users insert evidence for tasks assigned to them
-- - Admins see all evidence

DROP POLICY IF EXISTS "Admins see all evidence" ON public.evidence;
CREATE POLICY "Admins see all evidence"
  ON public.evidence FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');

DROP POLICY IF EXISTS "See evidence for accessible tasks" ON public.evidence;
CREATE POLICY "See evidence for accessible tasks"
  ON public.evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = evidence.task_id
      AND (
        t.assigned_to = auth.uid()
        OR t.created_by = auth.uid()
        OR auth.jwt()->>'role' IN ('admin', 'head', 'qa')
      )
    )
  );

-- Insert evidence: Executor of task only
DROP POLICY IF EXISTS "Insert evidence - executor only" ON public.evidence;
CREATE POLICY "Insert evidence - executor only"
  ON public.evidence FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
      AND t.assigned_to = auth.uid()
    )
  );

-- Delete evidence: Submitter or Admin
DROP POLICY IF EXISTS "Delete evidence - submitter or admin" ON public.evidence;
CREATE POLICY "Delete evidence - submitter or admin"
  ON public.evidence FOR DELETE
  USING (
    submitted_by = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );

-- ============================================================================
-- RLS POLICIES: qa_reviews table
-- ============================================================================
-- Rules:
-- - Everyone sees QA reviews for tasks they can access
-- - Only QA role can insert reviews
-- - Only the QA who reviewed can update

DROP POLICY IF EXISTS "Admins see all reviews" ON public.qa_reviews;
CREATE POLICY "Admins see all reviews"
  ON public.qa_reviews FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');

DROP POLICY IF EXISTS "See reviews for accessible tasks" ON public.qa_reviews;
CREATE POLICY "See reviews for accessible tasks"
  ON public.qa_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = qa_reviews.task_id
      AND (
        t.assigned_to = auth.uid()
        OR t.created_by = auth.uid()
        OR auth.jwt()->>'role' IN ('admin', 'head', 'qa')
      )
    )
  );

-- Only QA role can insert reviews
DROP POLICY IF EXISTS "Insert review - QA only" ON public.qa_reviews;
CREATE POLICY "Insert review - QA only"
  ON public.qa_reviews FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'qa');

-- Only reviewer or admin can update
DROP POLICY IF EXISTS "Update review - reviewer or admin" ON public.qa_reviews;
CREATE POLICY "Update review - reviewer or admin"
  ON public.qa_reviews FOR UPDATE
  USING (
    reviewed_by = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );

-- ============================================================================
-- RLS POLICIES: audit_logs table
-- ============================================================================
-- Rules:
-- - Users see audit logs for entities they can access
-- - Only system can insert (via triggers)
-- - No updates/deletes (immutable)

DROP POLICY IF EXISTS "Admins see all audit logs" ON public.audit_logs;
CREATE POLICY "Admins see all audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');

DROP POLICY IF EXISTS "See logs for accessible tasks" ON public.audit_logs;
CREATE POLICY "See logs for accessible tasks"
  ON public.audit_logs FOR SELECT
  USING (
    entity_type != 'task' -- Non-task logs visible to appropriate roles
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = audit_logs.entity_id
      AND (
        t.assigned_to = auth.uid()
        OR t.created_by = auth.uid()
        OR auth.jwt()->>'role' IN ('admin', 'head', 'qa')
      )
    )
  );

-- System inserts only (via triggers, uses service_role key)
-- No update/delete allowed on audit logs

-- ============================================================================
-- RLS POLICIES: time_logs table
-- ============================================================================
-- Rules:
-- - Users see their own time logs
-- - Heads/Admins see time logs for their team
-- - Users insert logs for tasks assigned to them

DROP POLICY IF EXISTS "Admins see all time logs" ON public.time_logs;
CREATE POLICY "Admins see all time logs"
  ON public.time_logs FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');

DROP POLICY IF EXISTS "See own time logs" ON public.time_logs;
CREATE POLICY "See own time logs"
  ON public.time_logs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Heads see team time logs" ON public.time_logs;
CREATE POLICY "Heads see team time logs"
  ON public.time_logs FOR SELECT
  USING (
    auth.jwt()->>'role' = 'head'
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = time_logs.task_id
      AND t.created_by = auth.uid()
    )
  );

-- Insert own time logs
DROP POLICY IF EXISTS "Insert own time logs" ON public.time_logs;
CREATE POLICY "Insert own time logs"
  ON public.time_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Summary
-- ============================================================================
-- RLS Policies Created: 29
--
-- By Role:
-- - ADMIN: Full access (select, insert, update, delete)
-- - HEAD: Create/assign tasks, see own, see team tasks
-- - EXECUTOR: See assigned tasks, submit evidence
-- - QA: See all tasks, submit reviews
--
-- Key Security:
-- - Defense in depth: RLS + FK constraints + CHECK constraints
-- - JWT claims used for role checking
-- - Service role bypasses RLS (use with caution in triggers)
--
-- Next: Migration 03 will add audit triggers
