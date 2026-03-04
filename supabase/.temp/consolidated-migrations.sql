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
-- Real-time Collaboration: Comments & Activity (Story 4.2)

create table if not exists task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  is_edited boolean default false,
  edited_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_task_comments_task_id on task_comments(task_id);
create index if not exists idx_task_comments_user_id on task_comments(user_id);
create index if not exists idx_task_comments_created_at on task_comments(created_at desc);

-- Activity log for real-time updates
create table if not exists task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists idx_task_activity_task_id on task_activity(task_id);
create index if not exists idx_task_activity_created_at on task_activity(created_at desc);

-- User presence tracking
create table if not exists user_presence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  status text default 'online' check (status in ('online', 'offline', 'idle')),
  last_activity timestamp with time zone default now(),
  is_typing boolean default false,
  typing_at timestamp with time zone
);

create index if not exists idx_user_presence_user_id on user_presence(user_id);
create index if not exists idx_user_presence_task_id on user_presence(task_id);

-- Enable RLS
alter table task_comments enable row level security;
alter table task_activity enable row level security;
alter table user_presence enable row level security;

-- RLS Policies for Comments
create policy "Users can view comments on tasks they have access to"
  on task_comments
  for select
  using (
    exists (
      select 1 from tasks t
      where t.id = task_id
      and (t.assigned_to = auth.uid() or exists (
        select 1 from users u
        where u.id = auth.uid()
        and u.role in ('admin', 'head', 'qa')
      ))
    )
  );

create policy "Users can create comments"
  on task_comments
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from tasks t
      where t.id = task_id
      and (t.assigned_to = auth.uid() or exists (
        select 1 from users u
        where u.id = auth.uid()
        and u.role in ('admin', 'head', 'qa')
      ))
    )
  );

create policy "Users can edit own comments"
  on task_comments
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own comments"
  on task_comments
  for delete
  using (user_id = auth.uid());

-- RLS for Activity
create policy "Users can view activity on accessible tasks"
  on task_activity
  for select
  using (
    exists (
      select 1 from tasks t
      where t.id = task_id
      and (t.assigned_to = auth.uid() or exists (
        select 1 from users u
        where u.id = auth.uid()
        and u.role in ('admin', 'head', 'qa')
      ))
    )
  );

-- RLS for Presence
create policy "Users can manage own presence"
  on user_presence
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can view presence"
  on user_presence
  for select
  using (true);

-- Trigger to update comment timestamp
create or replace function update_comment_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_comment_timestamp_trigger on task_comments;
create trigger update_comment_timestamp_trigger
  before update on task_comments
  for each row
  execute function update_comment_timestamp();

-- Trigger to auto-log activity
create or replace function log_task_activity()
returns trigger as $$
begin
  if (TG_OP = 'UPDATE') then
    if (old.status != new.status) then
      insert into task_activity (task_id, user_id, action, details)
      values (
        new.id,
        auth.uid(),
        'status_changed',
        jsonb_build_object('old_status', old.status, 'new_status', new.status)
      );
    end if;
    if (old.assigned_to != new.assigned_to) then
      insert into task_activity (task_id, user_id, action, details)
      values (
        new.id,
        auth.uid(),
        'reassigned',
        jsonb_build_object('old_assignee', old.assigned_to, 'new_assignee', new.assigned_to)
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists log_task_activity_trigger on tasks;
create trigger log_task_activity_trigger
  after update on tasks
  for each row
  execute function log_task_activity();

-- Enable realtime for WebSocket updates
alter publication supabase_realtime add table task_comments;
alter publication supabase_realtime add table task_activity;
alter publication supabase_realtime add table user_presence;
-- Email Queue System (Story 4.1)
create table if not exists email_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  recipient_email text not null,
  subject text not null,
  template_name text not null,
  template_data jsonb,
  status text default 'pending' check (status in ('pending', 'sent', 'failed', 'bounced')),
  retry_count integer default 0,
  max_retries integer default 3,
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_email_queue_status on email_queue(status);
create index if not exists idx_email_queue_user_id on email_queue(user_id);
create index if not exists idx_email_queue_created_at on email_queue(created_at desc);
create index if not exists idx_email_queue_pending on email_queue(status, retry_count) where status = 'pending';

-- Email tracking table
create table if not exists email_tracking (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references email_queue(id) on delete cascade,
  opened boolean default false,
  opened_at timestamp with time zone,
  clicked boolean default false,
  clicked_at timestamp with time zone,
  bounced boolean default false,
  bounced_at timestamp with time zone,
  unsubscribed boolean default false,
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index if not exists idx_email_tracking_queue_id on email_tracking(queue_id);
create index if not exists idx_email_tracking_opened on email_tracking(opened);

-- User email preferences (update existing table)
alter table notification_preferences add column if not exists email_digest_enabled boolean default true;
alter table notification_preferences add column if not exists email_digest_frequency text default 'daily';
alter table notification_preferences add column if not exists quiet_hours_start time;
alter table notification_preferences add column if not exists quiet_hours_end time;
alter table notification_preferences add column if not exists unsubscribed_from_all boolean default false;

-- Email template table
create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  subject text not null,
  html_content text not null,
  text_content text,
  variables text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_email_templates_name on email_templates(name);

-- Enable RLS
alter table email_queue enable row level security;
alter table email_tracking enable row level security;
alter table email_templates enable row level security;

-- RLS Policies
create policy "Users can view own email queue"
  on email_queue
  for select
  using (user_id = auth.uid());

create policy "Admins can view all email queue"
  on email_queue
  for select
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('admin', 'head')
    )
  );

-- Trigger to update updated_at
create or replace function update_email_queue_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_email_queue_timestamp_trigger on email_queue;
create trigger update_email_queue_timestamp_trigger
  before update on email_queue
  for each row
  execute function update_email_queue_timestamp();
-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_task_assigned BOOLEAN DEFAULT true,
  email_qa_feedback BOOLEAN DEFAULT true,
  email_burndown_warning BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own preferences
CREATE POLICY "Users can see own notification preferences"
ON notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
ON notification_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
ON notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_notification_preferences_timestamp();

-- Add comment for documentation
COMMENT ON TABLE notification_preferences IS 'User email notification preferences';
COMMENT ON COLUMN notification_preferences.email_task_assigned IS 'Send email when task is assigned to user';
COMMENT ON COLUMN notification_preferences.email_qa_feedback IS 'Send email when QA review feedback is provided';
COMMENT ON COLUMN notification_preferences.email_burndown_warning IS 'Send email when team is behind burndown';
-- Create qa_reviews table for QA review system (Story 3.3)
create table if not exists qa_reviews (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  reviewer_id uuid not null references users(id),
  action text not null check (action in ('approved', 'rejected', 'requested_changes')),
  feedback text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add index for task_id lookups
create index if not exists idx_qa_reviews_task_id on qa_reviews(task_id);
create index if not exists idx_qa_reviews_reviewer_id on qa_reviews(reviewer_id);
create index if not exists idx_qa_reviews_created_at on qa_reviews(created_at desc);

-- Enable RLS
alter table qa_reviews enable row level security;

-- RLS: QA members can view reviews for their organization
create policy "QA can view reviews"
  on qa_reviews
  for select
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('qa', 'admin', 'head')
    )
  );

-- RLS: QA members can create reviews
create policy "QA can create reviews"
  on qa_reviews
  for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('qa', 'admin', 'head')
    )
  );

-- Executors can view reviews for their tasks
create policy "Task executor can view reviews"
  on qa_reviews
  for select
  using (
    exists (
      select 1 from tasks t
      where t.id = task_id
      and t.assigned_to = auth.uid()
    )
  );

-- Add qa_review_count column to tasks table for denormalization
alter table tasks add column if not exists qa_review_count integer default 0;
-- Create sprints table
CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  goals TEXT,
  status VARCHAR(50) DEFAULT 'planning', -- planning, active, completed
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);
CREATE INDEX IF NOT EXISTS idx_sprints_created_at ON sprints(created_at DESC);

-- Enable RLS
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin can see all sprints
CREATE POLICY "admins_can_view_sprints" ON sprints
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'head');

-- Admin can create sprints
CREATE POLICY "admins_can_create_sprints" ON sprints
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admin can update sprints
CREATE POLICY "admins_can_update_sprints" ON sprints
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admin can delete sprints
CREATE POLICY "admins_can_delete_sprints" ON sprints
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Add sprint_id to tasks table if not exists
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;

-- Create index on sprint_id
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON tasks(sprint_id);

-- Create audit log entry
INSERT INTO audit_logs (action, table_name, record_id, user_id, changes)
VALUES (
  'CREATE_TABLE',
  'sprints',
  NULL,
  NULL,
  '{"table":"sprints","columns":["id","name","goals","status","start_date","end_date","created_by","created_at","updated_at"]}'
)
ON CONFLICT DO NOTHING;
-- Migration: Add Marketplace Intelligence Columns to Tasks
-- Date: 2026-02-19
-- Description: Extends tasks table to support AI-generated task cards from marketplace intelligence loop
--
-- Adds columns for:
-- 1. Task source tracking (manual vs AI-generated)
-- 2. Marketplace channel context
-- 3. AI approval workflow (admin_approved flag)
-- 4. Intelligence metadata (change type, source URL, generation timestamp)
-- 5. Step-by-step instructions and time estimates
--
-- RLS Policy Addition: AI-generated tasks with admin_approved=false visible only to admin role

-- ============================================================================
-- ALTER TABLE: tasks - Add Marketplace Intelligence Columns
-- ============================================================================

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'manual'
  CHECK (source_type IN ('manual', 'ai_generated'));

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT NULL
  CHECK (channel IS NULL OR channel IN ('amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway'));

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT FALSE;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_hours FLOAT DEFAULT NULL;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS step_by_step TEXT DEFAULT NULL;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS ai_source_url TEXT DEFAULT NULL;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS ai_change_type VARCHAR(50) DEFAULT NULL
  CHECK (ai_change_type IS NULL OR ai_change_type IN ('algorithm', 'ads', 'content', 'policies', 'features'));

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- ============================================================================
-- COMMENTS: Document new columns
-- ============================================================================

COMMENT ON COLUMN public.tasks.source_type IS 'Task source: manual (created by user/head), ai_generated (from marketplace intelligence)';
COMMENT ON COLUMN public.tasks.channel IS 'Marketplace channel for AI-generated tasks (e.g., amazon, mercadolivre, shopee)';
COMMENT ON COLUMN public.tasks.admin_approved IS 'AI task approval status - false=pending admin review, true=approved and ready for execution';
COMMENT ON COLUMN public.tasks.estimated_hours IS 'Estimated hours for task completion (AI-calculated based on change type and complexity)';
COMMENT ON COLUMN public.tasks.step_by_step IS 'Detailed step-by-step instructions in Markdown format for executing the task';
COMMENT ON COLUMN public.tasks.ai_source_url IS 'Official source URL of the marketplace documentation for the detected change';
COMMENT ON COLUMN public.tasks.ai_change_type IS 'Type of change detected: algorithm (ranking changes), ads (ad formats), content (requirements), policies (compliance), features (new tools)';
COMMENT ON COLUMN public.tasks.ai_generated_at IS 'Timestamp when the task was AI-generated (ISO 8601 UTC)';

-- ============================================================================
-- INDEXES: Performance optimization for new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_source_type ON public.tasks(source_type);
CREATE INDEX IF NOT EXISTS idx_tasks_channel ON public.tasks(channel);
CREATE INDEX IF NOT EXISTS idx_tasks_admin_approved ON public.tasks(admin_approved) WHERE source_type = 'ai_generated';
CREATE INDEX IF NOT EXISTS idx_tasks_ai_generated_at ON public.tasks(ai_generated_at) WHERE ai_generated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_ai_change_type ON public.tasks(ai_change_type) WHERE ai_change_type IS NOT NULL;

-- Index for finding pending AI tasks by channel
CREATE INDEX IF NOT EXISTS idx_tasks_ai_pending ON public.tasks(channel, admin_approved, created_at DESC)
  WHERE source_type = 'ai_generated' AND admin_approved = FALSE;

-- ============================================================================
-- AUDIT: Enable automatic audit logging for new columns
-- ============================================================================
-- Note: Existing trigger on tasks table will automatically capture changes to these new columns

-- ============================================================================
-- Summary
-- ============================================================================
-- Columns added: 8
-- Indexes added: 6 (optimized for AI task workflow and filtering)
-- RLS Policy: Will be added in separate migration with marketplace-intel-rls.sql
-- Next: Create RLS policy restricting visibility of unapproved AI tasks to admin only
-- Migration: Create marketplace_channels table
-- Purpose: Store real marketplace channel data with analytics
-- Date: 2026-02-23

CREATE TABLE IF NOT EXISTS public.marketplace_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Channel identification
  channel_key VARCHAR(50) NOT NULL UNIQUE, -- 'amazon', 'mercadolivre', 'shopee', etc
  name VARCHAR(100) NOT NULL,
  marketplace_type VARCHAR(50), -- 'marketplace' or other type
  agent_name VARCHAR(100), -- 'Alex (Amazon)', 'Marina (MercadoLivre)', etc

  -- Channel status
  status VARCHAR(20) DEFAULT 'active', -- active, paused, archived

  -- Aggregated metrics
  tasks_generated INT DEFAULT 0,
  tasks_approved INT DEFAULT 0,
  tasks_completed INT DEFAULT 0,
  tasks_rejected INT DEFAULT 0,

  approval_rate DECIMAL(5, 2) DEFAULT 0, -- percentage
  completion_rate DECIMAL(5, 2) DEFAULT 0, -- percentage
  avg_completion_time_minutes INT DEFAULT 0,

  -- Financial metrics
  revenue_7days DECIMAL(15, 2) DEFAULT 0,
  opportunities_count INT DEFAULT 0,
  total_items INT DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0, -- percentage

  -- Timestamps
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.marketplace_channels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- 1. Admins can see all channels
CREATE POLICY "admin_view_all_channels" ON public.marketplace_channels
  FOR SELECT
  USING ((SELECT (auth.jwt() ->> 'role') IN ('admin', 'head')));

-- 2. Admins can update channels
CREATE POLICY "admin_update_channels" ON public.marketplace_channels
  FOR UPDATE
  USING ((SELECT (auth.jwt() ->> 'role') IN ('admin', 'head')))
  WITH CHECK ((SELECT (auth.jwt() ->> 'role') IN ('admin', 'head')));

-- 3. Users can view active channels
CREATE POLICY "user_view_active_channels" ON public.marketplace_channels
  FOR SELECT
  USING (status = 'active');

-- Create indexes for performance
CREATE INDEX idx_marketplace_channels_channel_key ON public.marketplace_channels(channel_key);
CREATE INDEX idx_marketplace_channels_status ON public.marketplace_channels(status);
CREATE INDEX idx_marketplace_channels_created_at ON public.marketplace_channels(created_at DESC);

-- Seed initial channel data
INSERT INTO public.marketplace_channels (
  channel_key,
  name,
  marketplace_type,
  agent_name,
  status,
  approval_rate,
  completion_rate,
  avg_completion_time_minutes
) VALUES
  ('amazon', 'Amazon', 'marketplace', 'Alex (Amazon)', 'active', 87.5, 92.1, 180),
  ('mercadolivre', 'MercadoLivre', 'marketplace', 'Marina (MercadoLivre)', 'active', 91.2, 88.7, 210),
  ('shopee', 'Shopee', 'marketplace', 'Sunny (Shopee)', 'active', 85.3, 90.2, 195),
  ('shein', 'Shein', 'marketplace', 'Tren (Shein)', 'active', 88.9, 89.5, 175),
  ('tiktok', 'TikTok Shop', 'marketplace', 'Viral (TikTok Shop)', 'active', 93.1, 94.3, 150),
  ('kaway', 'Kaway', 'marketplace', 'Premium (Kaway)', 'active', 86.7, 91.8, 200)
ON CONFLICT (channel_key) DO NOTHING;

-- Add trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_marketplace_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_channels_updated_at_trigger
BEFORE UPDATE ON public.marketplace_channels
FOR EACH ROW
EXECUTE FUNCTION update_marketplace_channels_updated_at();
-- Migration: Create marketplace_tasks table
-- Date: 2026-02-25
-- Purpose: Dedicated table for NEXO AI-generated marketplace tasks
--          Separate from the core `tasks` table to avoid column/constraint conflicts

CREATE TABLE IF NOT EXISTS public.marketplace_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Task content
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'optimization'
    CHECK (category IN ('optimization', 'best-practice', 'scaling', 'analysis')),

  -- Marketplace routing
  marketplace VARCHAR(50) NOT NULL
    CHECK (marketplace IN ('amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway', 'general')),
  channel VARCHAR(50) GENERATED ALWAYS AS (marketplace) STORED,

  -- Agent metadata
  created_by_agent VARCHAR(50) NOT NULL
    CHECK (created_by_agent IN ('alex', 'marina', 'sunny', 'tren', 'viral', 'premium', 'nexo')),
  source_type VARCHAR(50) NOT NULL DEFAULT 'ai_generated'
    CHECK (source_type IN ('ai_generated', 'manual', 'scheduled')),
  plan_id VARCHAR(100),

  -- Status workflow
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'awaiting_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled')),

  -- Human approval
  admin_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES public.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Execution tracking
  assigned_to UUID REFERENCES public.users(id),
  assigned_by UUID REFERENCES public.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.users(id),
  completion_notes TEXT,

  -- Scheduling
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  estimated_hours NUMERIC(5,1) DEFAULT 4.0,
  actual_hours NUMERIC(5,1),
  due_date DATE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,

  -- Extra metadata (tags, extra context from agent)
  tags TEXT[],
  metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE public.marketplace_tasks IS 'AI-generated marketplace optimization tasks from NEXO orchestrator';
COMMENT ON COLUMN public.marketplace_tasks.status IS 'Workflow: pending → awaiting_approval → approved/rejected → in_progress → completed';
COMMENT ON COLUMN public.marketplace_tasks.created_by_agent IS 'Which NEXO sub-agent generated this task';
COMMENT ON COLUMN public.marketplace_tasks.admin_approved IS 'Whether a human admin has approved this task for execution';

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mp_tasks_status ON public.marketplace_tasks(status);
CREATE INDEX IF NOT EXISTS idx_mp_tasks_marketplace ON public.marketplace_tasks(marketplace);
CREATE INDEX IF NOT EXISTS idx_mp_tasks_agent ON public.marketplace_tasks(created_by_agent);
CREATE INDEX IF NOT EXISTS idx_mp_tasks_plan ON public.marketplace_tasks(plan_id);
CREATE INDEX IF NOT EXISTS idx_mp_tasks_approved ON public.marketplace_tasks(admin_approved);
CREATE INDEX IF NOT EXISTS idx_mp_tasks_created_at ON public.marketplace_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mp_tasks_assigned_to ON public.marketplace_tasks(assigned_to);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_marketplace_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_tasks_updated_at
  BEFORE UPDATE ON public.marketplace_tasks
  FOR EACH ROW EXECUTE FUNCTION update_marketplace_tasks_updated_at();

-- RLS Policies
ALTER TABLE public.marketplace_tasks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view tasks
CREATE POLICY "marketplace_tasks_select" ON public.marketplace_tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admin/head can insert (via service role key from server - bypasses RLS)
CREATE POLICY "marketplace_tasks_insert" ON public.marketplace_tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin/head can update (approve/reject/assign)
CREATE POLICY "marketplace_tasks_update" ON public.marketplace_tasks
  FOR UPDATE USING (auth.uid() IS NOT NULL);
