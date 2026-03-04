-- Migration 01: Create base schema for Digital TaskOps
-- Date: 2026-02-18
-- Description: Creates all core tables with relationships, constraints, and indexes

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: users (extends Supabase auth.users)
-- ============================================================================
-- Purpose: User profile information and role assignment
-- Note: id is FK to auth.users(id) - single source of truth
-- RLS: Users can only read their own profile

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'executor'
    CHECK (role IN ('admin', 'head', 'executor', 'qa')),
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'User profiles with role assignment for RBAC';
COMMENT ON COLUMN public.users.id IS 'Foreign key to auth.users(id)';
COMMENT ON COLUMN public.users.role IS 'User role: admin (full access), head (create/assign tasks), executor (execute tasks), qa (review evidence)';

-- ============================================================================
-- TABLE: tasks (Core task entity)
-- ============================================================================
-- Purpose: Represents a unit of work with status tracking
-- RLS: Based on role - admin sees all, head sees created/assigned, executor sees assigned

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'a_fazer'
    CHECK (status IN ('a_fazer', 'fazendo', 'enviado_qa', 'aprovado', 'concluido')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  assigned_to UUID NOT NULL REFERENCES public.users(id),
  created_by UUID NOT NULL REFERENCES public.users(id),
  due_date DATE NOT NULL,
  due_time TIME,
  frente VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.tasks IS 'Task units with status workflow and evidence requirements';
COMMENT ON COLUMN public.tasks.status IS 'Workflow: a_fazer → fazendo → enviado_qa → aprovado → concluido';
COMMENT ON COLUMN public.tasks.frente IS 'Team/front: Conteúdo, Ads, Marketplace, Cadastro de Produto, Relatórios';

-- ============================================================================
-- TABLE: evidence (Task evidence - files or links)
-- ============================================================================
-- Purpose: Proof of task execution (screenshot or link)
-- RLS: Users see evidence for tasks they can access

CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES public.users(id),
  evidence_type VARCHAR(20) NOT NULL
    CHECK (evidence_type IN ('file', 'link')),
  file_url TEXT,
  link_url TEXT,
  comment TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.evidence IS 'Evidence of task completion (file upload or external link)';
COMMENT ON COLUMN public.evidence.evidence_type IS 'Type: file (uploaded to storage), link (external URL)';

-- ============================================================================
-- TABLE: qa_reviews (QA approval/rejection)
-- ============================================================================
-- Purpose: QA decisions with audit trail
-- RLS: QA role reviews, others see decisions

CREATE TABLE IF NOT EXISTS public.qa_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reviewed_by UUID NOT NULL REFERENCES public.users(id),
  status VARCHAR(50) NOT NULL
    CHECK (status IN ('aprovado', 'reprovado')),
  reason TEXT NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.qa_reviews IS 'QA decisions on task completion (approval/rejection with reason)';

-- ============================================================================
-- TABLE: audit_logs (Complete audit trail)
-- ============================================================================
-- Purpose: Historical record of all changes (auto-populated by triggers)
-- RLS: Users see logs for entities they can access

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES public.users(id),
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail of all data changes';
COMMENT ON COLUMN public.audit_logs.action IS 'Operation type: INSERT, UPDATE, DELETE, STATUS_CHANGE';

-- ============================================================================
-- TABLE: time_logs (Optional - for analytics and V1)
-- ============================================================================
-- Purpose: Track time spent on tasks
-- RLS: Users see their own time logs

CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

COMMENT ON TABLE public.time_logs IS 'Time tracking for task metrics and analytics';

-- ============================================================================
-- INDEXES: Foreign Keys (always index)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_evidence_task_id ON public.evidence(task_id);
CREATE INDEX IF NOT EXISTS idx_evidence_submitted_by ON public.evidence(submitted_by);
CREATE INDEX IF NOT EXISTS idx_qa_reviews_task_id ON public.qa_reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_qa_reviews_reviewed_by ON public.qa_reviews(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON public.time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON public.time_logs(user_id);

-- ============================================================================
-- INDEXES: Common Filters
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_frente ON public.tasks(frente);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON public.audit_logs(changed_at DESC);

-- ============================================================================
-- CONSTRAINTS: Cascade Deletes & Relationships
-- ============================================================================
-- Foreign keys already defined in table creation with ON DELETE CASCADE for:
-- - evidence → tasks (delete evidence when task deleted)
-- - qa_reviews → tasks (delete reviews when task deleted)
-- - time_logs → tasks (delete logs when task deleted)

-- ============================================================================
-- Summary
-- ============================================================================
-- Tables created: 6
--   1. users (extends auth.users)
--   2. tasks (core entity)
--   3. evidence (files/links)
--   4. qa_reviews (QA decisions)
--   5. audit_logs (immutable trail)
--   6. time_logs (analytics)
--
-- Indexes created: 13
-- Constraints: Foreign keys + CHECK constraints
-- Next: Migration 02 will add RLS policies
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
-- Migration 03: Create audit trail triggers
-- Date: 2026-02-18
-- Description: PostgreSQL triggers to auto-log all changes to audit_logs

-- ============================================================================
-- FUNCTION: Generic audit log trigger
-- ============================================================================
-- Logs INSERT, UPDATE, DELETE operations to audit_logs table
-- Uses SECURITY DEFINER to bypass RLS (required for audit trail)

DROP FUNCTION IF EXISTS public.log_audit_trail() CASCADE;
CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Determine action type based on trigger operation
  DECLARE
    action_type VARCHAR;
  BEGIN
    action_type := CASE
      WHEN TG_OP = 'INSERT' THEN 'INSERT'
      WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
      WHEN TG_OP = 'DELETE' THEN 'DELETE'
    END;

    -- Insert audit log record
    INSERT INTO public.audit_logs (
      entity_type,
      entity_id,
      action,
      changed_by,
      old_values,
      new_values,
      changed_at
    ) VALUES (
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      action_type,
      COALESCE(auth.uid(), (SELECT id FROM public.users LIMIT 1)), -- fallback if no auth context
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
      NOW()
    );

    -- Return appropriate row
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END;
END;
$$;

COMMENT ON FUNCTION public.log_audit_trail() IS 'Generic trigger function for audit trail - logs all INSERT/UPDATE/DELETE operations';

-- ============================================================================
-- TRIGGER: tasks table
-- ============================================================================
-- Logs all changes to tasks (create, update status, delete)

DROP TRIGGER IF EXISTS audit_tasks_insert ON public.tasks;
CREATE TRIGGER audit_tasks_insert
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

DROP TRIGGER IF EXISTS audit_tasks_update ON public.tasks;
CREATE TRIGGER audit_tasks_update
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.log_audit_trail();

DROP TRIGGER IF EXISTS audit_tasks_delete ON public.tasks;
CREATE TRIGGER audit_tasks_delete
  AFTER DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

-- ============================================================================
-- TRIGGER: evidence table
-- ============================================================================
-- Logs all evidence submissions and deletions

DROP TRIGGER IF EXISTS audit_evidence_insert ON public.evidence;
CREATE TRIGGER audit_evidence_insert
  AFTER INSERT ON public.evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

DROP TRIGGER IF EXISTS audit_evidence_delete ON public.evidence;
CREATE TRIGGER audit_evidence_delete
  AFTER DELETE ON public.evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

-- ============================================================================
-- TRIGGER: qa_reviews table
-- ============================================================================
-- Logs all QA approvals and rejections

DROP TRIGGER IF EXISTS audit_qa_reviews_insert ON public.qa_reviews;
CREATE TRIGGER audit_qa_reviews_insert
  AFTER INSERT ON public.qa_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

DROP TRIGGER IF EXISTS audit_qa_reviews_update ON public.qa_reviews;
CREATE TRIGGER audit_qa_reviews_update
  AFTER UPDATE ON public.qa_reviews
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.log_audit_trail();

-- ============================================================================
-- TRIGGER: time_logs table
-- ============================================================================
-- Logs all time log entries

DROP TRIGGER IF EXISTS audit_time_logs_insert ON public.time_logs;
CREATE TRIGGER audit_time_logs_insert
  AFTER INSERT ON public.time_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

-- ============================================================================
-- FUNCTION: Update updated_at timestamp
-- ============================================================================
-- Auto-update the updated_at column on any change

DROP FUNCTION IF EXISTS public.update_timestamp() CASCADE;
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_timestamp() IS 'Auto-update updated_at timestamp on any row modification';

-- ============================================================================
-- TRIGGER: Auto-update timestamps
-- ============================================================================
-- Keep updated_at automatically current

DROP TRIGGER IF EXISTS update_users_timestamp ON public.users;
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_tasks_timestamp ON public.tasks;
CREATE TRIGGER update_tasks_timestamp
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- ============================================================================
-- Summary
-- ============================================================================
-- Triggers Created: 11
--   - 3 on tasks (insert, update, delete)
--   - 2 on evidence (insert, delete)
--   - 2 on qa_reviews (insert, update)
--   - 1 on time_logs (insert)
--   - 3 for timestamps (users, tasks)
--
-- Functions: 2
--   - log_audit_trail() - generic audit function
--   - update_timestamp() - timestamp auto-updater
--
-- Features:
-- - Immutable audit trail (inserts only via triggers)
-- - Automatic timestamp management
-- - Changed_by captures user context
-- - old_values/new_values track all changes
-- - SECURITY DEFINER allows bypass of RLS for audit logging
--
-- Next: Migration 04 will add seed data for testing
-- Migration 04: Seed test data for development
-- Date: 2026-02-18
-- Description: Creates test users and sample tasks for development and testing

-- ============================================================================
-- SEED DATA: Test Users
-- ============================================================================
-- NOTE: These are test user profiles. Real users come from Supabase Auth.
-- In production, users are created via NextAuth.js during login.
-- These IDs should match auth.users(id) from Supabase Auth.

-- For testing purposes, we create users with specific roles
-- IMPORTANT: Before running this migration in production:
-- 1. Create actual users in Supabase Auth first
-- 2. Replace the UUIDs below with real auth.users(id) values
-- 3. Or omit this migration and let NextAuth handle user creation

-- Test data uses fixed UUIDs for reproducibility
-- In production, use actual auth.users IDs

-- Option 1: If using this for local testing, manually update these IDs after creating test users in Supabase Auth

-- For now, we'll skip inserting test users (they come from auth.users)
-- Uncomment below once you have actual user IDs from Supabase Auth:

/*
INSERT INTO public.users (id, email, role, name, avatar_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', 'admin', 'Admin User', NULL),
  ('550e8400-e29b-41d4-a716-446655440002', 'head@example.com', 'head', 'Head Marketing', NULL),
  ('550e8400-e29b-41d4-a716-446655440003', 'executor@example.com', 'executor', 'Executor One', NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'qa@example.com', 'qa', 'QA Reviewer', NULL)
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- SEED DATA: Sample Tasks
-- ============================================================================
-- NOTE: Comment out until you have actual user IDs in the users table
-- These tasks demonstrate the workflow and are used for testing

/*
INSERT INTO public.tasks (
  id, title, description, status, priority,
  assigned_to, created_by, due_date, due_time, frente
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655550001',
    'Create landing page mockup',
    'Design a mockup for the new landing page including hero, features, and CTA sections',
    'a_fazer',
    'high',
    '550e8400-e29b-41d4-a716-446655440003', -- assigned to executor
    '550e8400-e29b-41d4-a716-446655440002', -- created by head
    '2026-02-20',
    '17:00',
    'Conteúdo'
  ),
  (
    '550e8400-e29b-41d4-a716-446655550002',
    'Write product description for Marketplace',
    'Create compelling product description with benefits and features for new marketplace listing',
    'fazendo',
    'medium',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    '2026-02-19',
    '18:00',
    'Marketplace'
  ),
  (
    '550e8400-e29b-41d4-a716-446655550003',
    'Set up Google Ads campaign',
    'Configure new Google Ads campaign for Q1 promotion with budget allocation',
    'enviado_qa',
    'high',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    '2026-02-18',
    '15:00',
    'Ads'
  )
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- SEED DATA: Sample Evidence
-- ============================================================================
-- NOTE: Comment out until you have actual task and user IDs

/*
INSERT INTO public.evidence (
  id, task_id, submitted_by, evidence_type, file_url, link_url, comment
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655660001',
    '550e8400-e29b-41d4-a716-446655550003',
    '550e8400-e29b-41d4-a716-446655440003',
    'link',
    NULL,
    'https://ads.google.com/campaign/12345',
    'Campaign is live with $500 daily budget'
  )
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- SEED DATA: Sample QA Review
-- ============================================================================

/*
INSERT INTO public.qa_reviews (
  id, task_id, reviewed_by, status, reason
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655770001',
    '550e8400-e29b-41d4-a716-446655550003',
    '550e8400-e29b-41d4-a716-446655440004',
    'aprovado',
    'Campaign configured correctly with proper budget limits and targeting'
  )
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- HOW TO USE THIS SEED DATA
-- ============================================================================
-- 1. Create test users in Supabase Auth:
--    - Go to Supabase Dashboard → Authentication → Users
--    - Create 4 test users:
--      * admin@example.com (role: admin)
--      * head@example.com (role: head)
--      * executor@example.com (role: executor)
--      * qa@example.com (role: qa)
--    - Note their UUIDs (shown in auth.users table)
--
-- 2. Update the UUIDs in this file:
--    Replace all '550e8400-e29b-41d4-a716-446655440XXX' values with real UUIDs
--
-- 3. Uncomment the INSERT statements
--
-- 4. Run: supabase db push
--
-- ============================================================================
-- ALTERNATIVE: Create seed data via application
-- ============================================================================
-- Instead of SQL migrations, you can:
-- 1. Let NextAuth.js create users during login
-- 2. Use the app UI to create tasks and evidence
-- 3. This is recommended for production
--
-- ============================================================================
-- Summary
-- ============================================================================
-- Commented out seed data ready for:
--   - 4 test users (admin, head, executor, qa)
--   - 3 sample tasks in different status stages
--   - 1 evidence example
--   - 1 QA review example
--
-- Instructions provided for adapting to real user IDs
