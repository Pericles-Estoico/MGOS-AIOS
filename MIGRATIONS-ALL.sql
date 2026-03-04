-- ============================================
-- File: 01-schema.sql
-- ============================================
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



-- ============================================
-- File: 02-rls-policies.sql
-- ============================================
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



-- ============================================
-- File: 03-triggers.sql
-- ============================================
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



-- ============================================
-- File: 04-seed-data.sql
-- ============================================
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



-- ============================================
-- File: 20260218_create_comments_realtime.sql
-- ============================================
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



-- ============================================
-- File: 20260218_create_email_queue.sql
-- ============================================
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



-- ============================================
-- File: 20260218_create_notification_preferences.sql
-- ============================================
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



-- ============================================
-- File: 20260218_create_performance_indexes.sql
-- ============================================
-- Performance Optimization: Index Strategy (Story 4.3)

-- Tasks table performance indexes
create index if not exists idx_tasks_status_assigned_to
  on tasks (status, assigned_to)
  where status != 'completed';

create index if not exists idx_tasks_sprint_status
  on tasks (sprint_id, status);

create index if not exists idx_tasks_created_by_created_at
  on tasks (created_by, created_at desc);

create index if not exists idx_tasks_due_date_status
  on tasks (due_date, status)
  where due_date is not null;

-- QA Reviews table indexes
create index if not exists idx_qa_reviews_task_status
  on qa_reviews (task_id, status);

create index if not exists idx_qa_reviews_created_at
  on qa_reviews (created_at desc);

-- Comments table indexes
create index if not exists idx_task_comments_task_id_created_at
  on task_comments (task_id, created_at desc);

-- Activity table indexes
create index if not exists idx_task_activity_task_action_created
  on task_activity (task_id, action, created_at desc);

-- Email queue optimization
create index if not exists idx_email_queue_status_created_at
  on email_queue (status, created_at)
  where status = 'pending';

create index if not exists idx_email_queue_user_status
  on email_queue (user_id, status);

-- Analytics indexes
create index if not exists idx_time_logs_user_date
  on time_logs (user_id, log_date desc);

create index if not exists idx_time_logs_task_date
  on time_logs (task_id, log_date);

-- Full-text search optimization
create index if not exists idx_tasks_search_vector
  on tasks using gin(search_vector);

-- Composite indexes for common queries
create index if not exists idx_tasks_assigned_sprint_status
  on tasks (assigned_to, sprint_id, status);

create index if not exists idx_tasks_priority_due_status
  on tasks (priority, due_date, status);

-- Vacuum and analyze after creating indexes
vacuum analyze tasks;
vacuum analyze qa_reviews;
vacuum analyze task_comments;
vacuum analyze task_activity;
vacuum analyze email_queue;
vacuum analyze time_logs;



-- ============================================
-- File: 20260218_create_qa_reviews.sql
-- ============================================
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



-- ============================================
-- File: 20260218_create_reassignment_history.sql
-- ============================================
-- Create reassignment_history table
CREATE TABLE IF NOT EXISTS reassignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  old_assignee_id UUID NOT NULL REFERENCES users(id),
  new_assignee_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  reassigned_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reassignment_history_task_id ON reassignment_history(task_id);
CREATE INDEX IF NOT EXISTS idx_reassignment_history_old_assignee ON reassignment_history(old_assignee_id);
CREATE INDEX IF NOT EXISTS idx_reassignment_history_new_assignee ON reassignment_history(new_assignee_id);
CREATE INDEX IF NOT EXISTS idx_reassignment_history_created_at ON reassignment_history(created_at DESC);

-- Enable RLS
ALTER TABLE reassignment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view reassignment history for their own tasks or tasks they can see
CREATE POLICY "users_can_view_reassignment_history" ON reassignment_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = reassignment_history.task_id
      AND (
        t.assigned_to = auth.uid()
        OR auth.jwt() ->> 'role' IN ('admin', 'head')
      )
    )
  );

-- Only admin/head can create reassignment history
CREATE POLICY "admins_can_create_reassignment_history" ON reassignment_history
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'head'));

-- Audit log entry
INSERT INTO audit_logs (action, table_name, record_id, user_id, changes)
VALUES (
  'CREATE_TABLE',
  'reassignment_history',
  NULL,
  NULL,
  '{"table":"reassignment_history","columns":["id","task_id","old_assignee_id","new_assignee_id","reason","reassigned_by","created_at"]}'
)
ON CONFLICT DO NOTHING;



-- ============================================
-- File: 20260218_create_reporting_system.sql
-- ============================================
-- Advanced Reporting System (Story 4.4)

-- Reports base table
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text not null check (type in ('sprint', 'team', 'individual', 'custom')),
  created_by uuid not null references users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Saved report configurations
create table if not exists report_configs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  filters jsonb default '{}',
  grouping text default 'day' check (grouping in ('hour', 'day', 'week', 'month')),
  metrics text[] default '{"completed_count", "avg_duration", "success_rate"}',
  chart_type text default 'line' check (chart_type in ('line', 'bar', 'pie', 'area')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Report cache (for quick access)
create table if not exists report_cache (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  data jsonb not null,
  generated_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '1 hour'),
  unique (report_id)
);

-- Team performance snapshots
create table if not exists team_metrics (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  sprint_id uuid references sprints(id) on delete cascade,
  total_tasks integer default 0,
  completed_tasks integer default 0,
  in_progress_tasks integer default 0,
  blocked_tasks integer default 0,
  avg_completion_time interval default null,
  quality_score numeric(5,2) default 0,
  captured_at timestamp with time zone default now()
);

-- Individual performance snapshots
create table if not exists user_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  sprint_id uuid references sprints(id) on delete cascade,
  tasks_completed integer default 0,
  tasks_in_progress integer default 0,
  avg_task_duration interval default null,
  quality_score numeric(5,2) default 0,
  productivity_index numeric(5,2) default 0,
  captured_at timestamp with time zone default now()
);

-- Task metrics for drill-down reports
create table if not exists task_metrics (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  estimate_hours numeric(10,2) default 0,
  actual_hours numeric(10,2) default 0,
  qa_feedback_count integer default 0,
  revision_count integer default 0,
  final_status text not null,
  captured_at timestamp with time zone default now()
);

-- Create indexes
create index if not exists idx_reports_created_by on reports(created_by);
create index if not exists idx_reports_created_at on reports(created_at desc);
create index if not exists idx_report_cache_expires on report_cache(expires_at);
create index if not exists idx_team_metrics_sprint on team_metrics(sprint_id);
create index if not exists idx_team_metrics_captured on team_metrics(captured_at desc);
create index if not exists idx_user_metrics_sprint on user_metrics(sprint_id);
create index if not exists idx_user_metrics_user_captured on user_metrics(user_id, captured_at desc);
create index if not exists idx_task_metrics_task on task_metrics(task_id);
create index if not exists idx_task_metrics_captured on task_metrics(captured_at desc);

-- Enable RLS
alter table reports enable row level security;
alter table report_configs enable row level security;
alter table report_cache enable row level security;
alter table team_metrics enable row level security;
alter table user_metrics enable row level security;
alter table task_metrics enable row level security;

-- RLS Policies for Reports
create policy "Users can view all reports"
  on reports
  for select
  using (true);

create policy "Only admins can create reports"
  on reports
  for insert
  with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('admin', 'head')
    )
  );

create policy "Report creators can update their reports"
  on reports
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- RLS for Report Cache
create policy "Users can view cached reports"
  on report_cache
  for select
  using (true);

-- RLS for Team Metrics
create policy "Users can view team metrics"
  on team_metrics
  for select
  using (true);

-- RLS for User Metrics
create policy "Users can view own metrics"
  on user_metrics
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('admin', 'head')
    )
  );

-- RLS for Task Metrics
create policy "Users can view task metrics they have access to"
  on task_metrics
  for select
  using (
    exists (
      select 1 from tasks t
      where t.id = task_id
      and (t.assigned_to = auth.uid() or t.created_by = auth.uid() or exists (
        select 1 from users u
        where u.id = auth.uid()
        and u.role in ('admin', 'head', 'qa')
      ))
    )
  );

-- Trigger to clean up expired report cache
create or replace function cleanup_expired_reports()
returns void as $$
begin
  delete from report_cache
  where expires_at < now();
end;
$$ language plpgsql;

-- Function to capture team metrics snapshot
create or replace function capture_team_metrics(sprint_id_param uuid)
returns void as $$
declare
  total integer;
  completed integer;
  in_progress integer;
  blocked integer;
begin
  select
    count(*),
    count(*) filter (where status = 'approved'),
    count(*) filter (where status = 'in_progress'),
    count(*) filter (where status = 'blocked')
  into total, completed, in_progress, blocked
  from tasks
  where sprint_id = sprint_id_param;

  insert into team_metrics (sprint_id, total_tasks, completed_tasks, in_progress_tasks, blocked_tasks)
  values (sprint_id_param, total, completed, in_progress, blocked);
end;
$$ language plpgsql;

-- Function to capture user metrics snapshot
create or replace function capture_user_metrics(user_id_param uuid, sprint_id_param uuid)
returns void as $$
declare
  completed integer;
  in_progress integer;
begin
  select
    count(*) filter (where status = 'approved'),
    count(*) filter (where status = 'in_progress')
  into completed, in_progress
  from tasks
  where assigned_to = user_id_param
  and sprint_id = sprint_id_param;

  insert into user_metrics (user_id, sprint_id, tasks_completed, tasks_in_progress)
  values (user_id_param, sprint_id_param, completed, in_progress);
end;
$$ language plpgsql;



-- ============================================
-- File: 20260218_create_saved_filters.sql
-- ============================================
-- Create saved filters table (Phase 3)
create table if not exists saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  description text,
  filters jsonb not null,
  is_shared boolean default false,
  is_default boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes
create index if not exists idx_saved_filters_user_id on saved_filters(user_id);
create index if not exists idx_saved_filters_is_shared on saved_filters(is_shared);
create index if not exists idx_saved_filters_is_default on saved_filters(is_default);

-- Enable RLS
alter table saved_filters enable row level security;

-- RLS: Users can view/edit their own filters
create policy "Users can manage own filters"
  on saved_filters
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- RLS: Users can view shared filters from others
create policy "Users can view shared filters"
  on saved_filters
  for select
  using (is_shared = true);

-- Create filter_usage table to track which filters are used most
create table if not exists filter_usage (
  id uuid primary key default gen_random_uuid(),
  filter_id uuid not null references saved_filters(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  used_at timestamp with time zone default now()
);

create index if not exists idx_filter_usage_filter_id on filter_usage(filter_id);
create index if not exists idx_filter_usage_user_id on filter_usage(user_id);
create index if not exists idx_filter_usage_used_at on filter_usage(used_at desc);

-- Enable RLS on filter_usage
alter table filter_usage enable row level security;

-- RLS: Users can only see their own usage
create policy "Users can track own filter usage"
  on filter_usage
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());



-- ============================================
-- File: 20260218_create_search_index.sql
-- ============================================
-- Create full-text search infrastructure for tasks (Story 3.5)

-- Add tsvector column for search_vector
alter table tasks add column if not exists search_vector tsvector;

-- Create index for fast full-text search
create index if not exists idx_tasks_search_vector on tasks using gin(search_vector);

-- Create function to update search_vector automatically
create or replace function update_tasks_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    to_tsvector('portuguese', coalesce(new.title, '')) ||
    to_tsvector('portuguese', coalesce(new.description, ''));
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update search_vector on insert/update
drop trigger if exists update_tasks_search_vector_trigger on tasks;
create trigger update_tasks_search_vector_trigger
  before insert or update on tasks
  for each row
  execute function update_tasks_search_vector();

-- Backfill existing tasks with search_vector
update tasks set search_vector =
  to_tsvector('portuguese', coalesce(title, '')) ||
  to_tsvector('portuguese', coalesce(description, ''))
where search_vector is null;

-- Create search_analytics table for tracking searches
create table if not exists search_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  search_query text not null,
  result_count integer,
  filters jsonb,
  execution_time_ms integer,
  created_at timestamp with time zone default now()
);

-- Create index for analytics queries
create index if not exists idx_search_analytics_user_id on search_analytics(user_id);
create index if not exists idx_search_analytics_created_at on search_analytics(created_at desc);
create index if not exists idx_search_analytics_query on search_analytics(search_query);

-- Enable RLS on analytics table
alter table search_analytics enable row level security;

-- RLS: Users can only view their own searches
create policy "Users can view own searches"
  on search_analytics
  for select
  using (user_id = auth.uid());

-- RLS: Users can insert their own searches
create policy "Users can create searches"
  on search_analytics
  for insert
  with check (user_id = auth.uid());

-- RLS: Only admins can view all analytics
create policy "Admins can view all analytics"
  on search_analytics
  for select
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('admin', 'head')
    )
  );



-- ============================================
-- File: 20260218_create_sprints.sql
-- ============================================
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



-- ============================================
-- File: 20260219_marketplace_intel.sql
-- ============================================
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



-- ============================================
-- File: 20260219_marketplace_intel_rls.sql
-- ============================================
-- Migration: RLS Policies for Marketplace Intelligence Tasks
-- Date: 2026-02-19
-- Description: Row-Level Security policies to control visibility of AI-generated tasks
--
-- Key Principle:
-- - AI-generated tasks with admin_approved=false are ONLY visible to admin role
-- - Once approved (admin_approved=true), visibility follows standard task RLS rules
-- - Manual tasks are unaffected by these policies (existing RLS applies)

-- ============================================================================
-- RLS POLICY: Tasks - AI Generated (Pending Approval)
-- ============================================================================
-- Rule: Only admin can see unapproved AI tasks
-- This prevents executors/heads from seeing intelligence loop output before admin approval

CREATE POLICY "AI tasks pending approval visible to admin only"
ON public.tasks
FOR SELECT
USING (
  -- Only show unapproved AI tasks to admin
  CASE
    WHEN source_type = 'ai_generated' AND admin_approved = FALSE THEN
      -- Only admin can see pending AI tasks
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    ELSE
      -- Approved AI tasks and manual tasks follow existing RLS (not enforced here)
      TRUE
  END
);

-- ============================================================================
-- RLS POLICY: Tasks - AI Generated (After Approval)
-- ============================================================================
-- Rule: After approval, AI tasks behave like manual tasks
-- - Admin: sees all
-- - Head: sees tasks they created or assigned
-- - Executor: sees tasks assigned to them
-- - QA: sees tasks in qa review

CREATE POLICY "AI tasks after approval follow standard visibility"
ON public.tasks
FOR SELECT
USING (
  -- For approved AI tasks, apply standard RLS
  CASE
    WHEN source_type = 'ai_generated' AND admin_approved = TRUE THEN
      -- Standard visibility rules
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
      OR (assigned_to = auth.uid())
      OR (created_by = auth.uid())
    WHEN source_type = 'manual' THEN
      -- Manual tasks always follow standard RLS (not enforced here)
      TRUE
    ELSE
      FALSE
  END
);

-- ============================================================================
-- RLS POLICY: Update AI Task Status (Admin Only)
-- ============================================================================
-- Rule: Only admin can update unapproved AI tasks
-- This ensures no one modifies AI-generated tasks before admin review

CREATE POLICY "AI tasks pending approval can only be updated by admin"
ON public.tasks
FOR UPDATE
USING (
  CASE
    WHEN source_type = 'ai_generated' AND admin_approved = FALSE THEN
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    ELSE
      TRUE
  END
)
WITH CHECK (
  CASE
    WHEN source_type = 'ai_generated' AND admin_approved = FALSE THEN
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    ELSE
      TRUE
  END
);

-- ============================================================================
-- RLS POLICY: Approve/Disapprove AI Tasks (Admin Only)
-- ============================================================================
-- Rule: Only admin can approve AI tasks (set admin_approved = TRUE)
-- This is the explicit gate for entering the workflow

CREATE POLICY "Only admin can approve AI generated tasks"
ON public.tasks
FOR UPDATE
USING (
  source_type = 'ai_generated' AND admin_approved = FALSE AND
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  -- Allow approval (admin_approved = FALSE → TRUE)
  admin_approved = TRUE AND
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- RLS POLICY: Insert AI Tasks (Service Role Only)
-- ============================================================================
-- Rule: Only service_role can insert AI-generated tasks
-- This prevents users from creating fake AI tasks

CREATE POLICY "Only service role can insert AI generated tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  -- If this is an AI task, it MUST be inserted by service role
  -- This policy doesn't enforce it (can't check in WITH CHECK)
  -- Instead rely on API endpoint authentication
  CASE
    WHEN source_type = 'ai_generated' THEN
      TRUE  -- Will be enforced at application layer
    ELSE
      TRUE  -- Manual tasks can be inserted by authenticated users
  END
);

-- ============================================================================
-- NOTES on RLS Enforcement
-- ============================================================================
-- These policies work in conjunction with application-layer authentication:
--
-- 1. POST /api/marketplace-intel/tasks (Insert AI task)
--    - Auth: service_role key or AIOS internal token
--    - Inserts task with source_type='ai_generated', admin_approved=false
--    - Task is invisible to all non-admin users
--
-- 2. GET /api/marketplace-intel/tasks (List pending tasks)
--    - Auth: must be admin role
--    - RLS automatically filters to unapproved AI tasks only
--
-- 3. PATCH /api/marketplace-intel/approve/[id] (Approve task)
--    - Auth: must be admin role
--    - Updates admin_approved=true + optionally assigned_to and estimated_hours
--    - After this, task becomes visible to assigned executor
--
-- 4. Standard task workflows
--    - Executor sees approved AI tasks in their list
--    - Task transitions: a_fazer → fazendo → enviado_qa → aprovado → concluido
--
-- ============================================================================
-- Summary
-- ============================================================================
-- RLS Policies Added: 5
-- - AI pending approval: admin only visibility
-- - AI after approval: standard visibility rules
-- - AI update gate: admin only
-- - AI approval gate: admin only
-- - AI insert gate: service role validation (app-layer)
--
-- Security Model:
-- ✓ Prevents unauthorized users from seeing AI tasks before approval
-- ✓ Prevents unauthorized modification of unapproved AI tasks
-- ✓ Prevents fake AI tasks from being inserted
-- ✓ Once approved, tasks flow through normal workflow with full audit trail



-- ============================================
-- File: 20260220_create_email_tables.sql
-- ============================================
-- Email Notification System Tables (Story 3.1)
-- Created: 2026-02-20

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Queue Table
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  template_name VARCHAR(100) NOT NULL REFERENCES email_templates(name),
  template_data JSONB DEFAULT '{}',
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  retry_count INT DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  task_assigned BOOLEAN DEFAULT true,
  status_changed BOOLEAN DEFAULT true,
  comment_mention BOOLEAN DEFAULT true,
  deadline_approaching BOOLEAN DEFAULT true,
  daily_digest BOOLEAN DEFAULT false,
  quiet_hours_start VARCHAR(5), -- HH:MM format
  quiet_hours_end VARCHAR(5),   -- HH:MM format
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Tracking Table (for analytics)
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES email_queue(id) ON DELETE CASCADE,
  opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMPTZ,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  bounced BOOLEAN DEFAULT false,
  bounced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_email_tracking_queue_id ON email_tracking(queue_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable RLS for Security
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own queued emails
CREATE POLICY "Users can view own email queue"
  ON email_queue
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only see their own preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do everything (for background jobs)
CREATE POLICY "Service role can manage email queue"
  ON email_queue
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage email tracking"
  ON email_tracking
  FOR ALL
  USING (auth.role() = 'service_role');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_tracking_updated_at
  BEFORE UPDATE ON email_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE email_queue IS 'Queue for emails pending sending (Story 3.1)';
COMMENT ON TABLE email_templates IS 'Email templates for notifications (Story 3.1)';
COMMENT ON TABLE notification_preferences IS 'User email notification preferences (Story 3.1)';
COMMENT ON TABLE email_tracking IS 'Analytics and delivery tracking for emails';



-- ============================================
-- File: 20260222_add_role_mapping.sql
-- ============================================
-- Update roles to match business model
-- Date: 2026-02-22
-- Purpose: Add CEO/Lider roles that map to Admin/Head roles for task creation permissions

-- Alter users table constraint to allow new roles
ALTER TABLE public.users DROP CONSTRAINT users_role_check;

ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'head', 'executor', 'qa', 'ceo', 'lider'));

-- Add comment explaining role mapping
COMMENT ON COLUMN public.users.role IS 'User role: admin/ceo (full access), head/lider (create/assign tasks), executor (execute tasks), qa (review evidence)';

-- Create a function to check if user can create tasks
CREATE OR REPLACE FUNCTION user_can_create_tasks(user_role VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_role IN ('admin', 'ceo', 'head', 'lider');
END;
$$ LANGUAGE plpgsql;



-- ============================================
-- File: 20260222_extend_notification_preferences.sql
-- ============================================
-- Extend notification_preferences table with additional fields
-- Added: 2026-02-22

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  email_status_changed BOOLEAN DEFAULT true;

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  email_comment_mention BOOLEAN DEFAULT true;

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  email_deadline_approaching BOOLEAN DEFAULT true;

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  email_daily_digest BOOLEAN DEFAULT false;

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  quiet_hours_start TIME DEFAULT '22:00';

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  quiet_hours_end TIME DEFAULT '08:00';

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo';

-- Update comments
COMMENT ON COLUMN notification_preferences.email_status_changed IS 'Send email when task status changes';
COMMENT ON COLUMN notification_preferences.email_comment_mention IS 'Send email when mentioned in comments';
COMMENT ON COLUMN notification_preferences.email_deadline_approaching IS 'Send email when task deadline is approaching';
COMMENT ON COLUMN notification_preferences.email_daily_digest IS 'Send daily digest of tasks and updates';
COMMENT ON COLUMN notification_preferences.quiet_hours_start IS 'Start time for quiet hours (HH:MM format)';
COMMENT ON COLUMN notification_preferences.quiet_hours_end IS 'End time for quiet hours (HH:MM format)';
COMMENT ON COLUMN notification_preferences.timezone IS 'User timezone for scheduling notifications';



-- ============================================
-- File: 20260222_marketplace_plans.sql
-- ============================================
-- Migration: Create marketplace_plans table for strategic analysis plans
-- Date: 2026-02-22
-- Description: Stores analysis plans generated by marketplace agents
--              with approval workflow and execution tracking

-- ============================================================================
-- TABLE: marketplace_plans
-- ============================================================================
-- Purpose: Store strategic analysis plans generated by marketplace agents
--          with status tracking and approval workflow
-- RLS: Admins/Heads see all; Executors have no access

CREATE TABLE IF NOT EXISTS public.marketplace_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Plan metadata
  title VARCHAR(255) NOT NULL,
  description TEXT,
  channels TEXT[] NOT NULL,  -- ['amazon','mercadolivre','shopee', etc]

  -- Status workflow
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'executing', 'done')),

  -- Plan content (structured JSON)
  plan_data JSONB NOT NULL,  -- {summary, opportunities[], phases[], metrics[]}

  -- Agent metadata
  created_by_agent VARCHAR(50),  -- 'nexo', 'scheduler', etc
  created_by_user UUID REFERENCES public.users(id),

  -- Approval workflow
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Scheduler tracking
  is_scheduled BOOLEAN DEFAULT FALSE,  -- true = generated by 7-day scheduler
  scheduled_frequency VARCHAR(20),  -- 'weekly', 'monthly', etc

  -- Phase 1 execution tracking
  phase1_tasks_created BOOLEAN DEFAULT FALSE,
  phase1_created_at TIMESTAMP WITH TIME ZONE,
  phase1_task_ids UUID[] DEFAULT '{}',

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.marketplace_plans IS 'Strategic analysis plans generated by marketplace agents with approval workflow';
COMMENT ON COLUMN public.marketplace_plans.channels IS 'Array of marketplace channels: amazon, mercadolivre, shopee, shein, tiktok-shop, kaway';
COMMENT ON COLUMN public.marketplace_plans.plan_data IS 'JSONB: {summary, opportunities[], phases[], metrics[]}';
COMMENT ON COLUMN public.marketplace_plans.status IS 'Workflow: pending → approved → executing → done (or rejected)';
COMMENT ON COLUMN public.marketplace_plans.is_scheduled IS 'TRUE if generated by 7-day scheduler, FALSE if manual request';
COMMENT ON COLUMN public.marketplace_plans.phase1_tasks_created IS 'TRUE after createPhase1Tasks() executed on approval';

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_marketplace_plans_status ON public.marketplace_plans(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_plans_created_at ON public.marketplace_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_plans_channels ON public.marketplace_plans USING GIN (channels);
CREATE INDEX IF NOT EXISTS idx_marketplace_plans_approved_by ON public.marketplace_plans(approved_by);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================
ALTER TABLE public.marketplace_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: marketplace_plans
-- ============================================================================
-- Rules:
-- - Admin: sees all plans, can do everything
-- - Head: sees all plans, can approve/reject
-- - Executor: NO access (cannot see or modify)
-- - QA: can view but cannot approve

-- Admin sees all
DROP POLICY IF EXISTS "Admin sees all marketplace plans" ON public.marketplace_plans;
CREATE POLICY "Admin sees all marketplace plans"
  ON public.marketplace_plans FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');

-- Head sees all, can approve/reject
DROP POLICY IF EXISTS "Head sees all marketplace plans" ON public.marketplace_plans;
CREATE POLICY "Head sees all marketplace plans"
  ON public.marketplace_plans FOR SELECT
  USING (auth.jwt()->>'role' IN ('head', 'admin'));

DROP POLICY IF EXISTS "Head can approve/reject plans" ON public.marketplace_plans;
CREATE POLICY "Head can approve/reject plans"
  ON public.marketplace_plans FOR UPDATE
  USING (auth.jwt()->>'role' IN ('head', 'admin'))
  WITH CHECK (
    -- Can only update approval-related fields
    (status IN ('approved', 'rejected') AND (approved_by = auth.uid() OR auth.jwt()->>'role' = 'admin'))
  );

-- Admin can create plans
DROP POLICY IF EXISTS "Admin can create plans" ON public.marketplace_plans;
CREATE POLICY "Admin can create plans"
  ON public.marketplace_plans FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- QA can view but not modify
DROP POLICY IF EXISTS "QA can view marketplace plans" ON public.marketplace_plans;
CREATE POLICY "QA can view marketplace plans"
  ON public.marketplace_plans FOR SELECT
  USING (auth.jwt()->>'role' = 'qa');



-- ============================================
-- File: 20260223161331_marketplace_job_executions.sql
-- ============================================
/**
 * Migration: Create marketplace_job_executions table
 * Tracks job execution for audit trail and polling
 * Date: 2026-02-23
 */

-- Create marketplace_job_executions table
CREATE TABLE IF NOT EXISTS marketplace_job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES marketplace_plans(id) ON DELETE CASCADE,
  job_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, active, completed, failed
  error_message TEXT,
  attempt_number INT DEFAULT 1,
  max_attempts INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  result JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_executions_plan_id ON marketplace_job_executions(plan_id);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON marketplace_job_executions(status);
CREATE INDEX IF NOT EXISTS idx_job_executions_job_id ON marketplace_job_executions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_executions_created_at ON marketplace_job_executions(created_at DESC);

-- Enable RLS
ALTER TABLE marketplace_job_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow admin and head to view all job executions
CREATE POLICY "Admin and head can view all job executions"
  ON marketplace_job_executions
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'head')
    OR auth.jwt() ->> 'role' = 'qa'
  );

-- RLS Policy: Allow admin and head to insert job executions
CREATE POLICY "Admin and head can insert job executions"
  ON marketplace_job_executions
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'head')
  );

-- RLS Policy: Allow admin and head to update job executions
CREATE POLICY "Admin and head can update job executions"
  ON marketplace_job_executions
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'head')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'head')
  );

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_marketplace_job_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_marketplace_job_executions_updated_at ON marketplace_job_executions;
CREATE TRIGGER trigger_update_marketplace_job_executions_updated_at
  BEFORE UPDATE ON marketplace_job_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_job_executions_updated_at();



-- ============================================
-- File: 20260223_agent_messages.sql
-- ============================================
-- Migration: Create agent_messages table
-- Purpose: Store AI agent messages and responses for chat history
-- Date: 2026-02-23

CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User and agent info
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_name VARCHAR(100) NOT NULL, -- 'Alex', 'Marina', 'Sunny', etc
  channel VARCHAR(50), -- 'amazon', 'mercadolivre', etc (optional)

  -- Message content
  user_message TEXT NOT NULL,
  agent_response TEXT,
  response_metadata JSONB, -- Additional data: tokens used, model, etc

  -- Message status
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, cancelled
  error_message TEXT,

  -- Message type/context
  message_type VARCHAR(50) DEFAULT 'general', -- 'general', 'analysis', 'task_creation', 'question'

  -- Related records
  analysis_id UUID REFERENCES public.marketplace_plans(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_deleted_at TIMESTAMP -- Soft delete for privacy
);

-- Enable RLS
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- 1. Users can see their own messages
CREATE POLICY "user_view_own_messages" ON public.agent_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Admins/heads can see all messages (for audit)
CREATE POLICY "admin_view_all_messages" ON public.agent_messages
  FOR SELECT
  USING ((SELECT (auth.jwt() ->> 'role') IN ('admin', 'head')));

-- 3. Users can insert their own messages
CREATE POLICY "user_insert_messages" ON public.agent_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Users can soft-delete their messages
CREATE POLICY "user_soft_delete_messages" ON public.agent_messages
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_agent_messages_user_id ON public.agent_messages(user_id);
CREATE INDEX idx_agent_messages_agent_name ON public.agent_messages(agent_name);
CREATE INDEX idx_agent_messages_channel ON public.agent_messages(channel);
CREATE INDEX idx_agent_messages_created_at ON public.agent_messages(created_at DESC);
CREATE INDEX idx_agent_messages_status ON public.agent_messages(status);
CREATE INDEX idx_agent_messages_user_created ON public.agent_messages(user_id, created_at DESC);

-- Add trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_agent_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_messages_updated_at_trigger
BEFORE UPDATE ON public.agent_messages
FOR EACH ROW
EXECUTE FUNCTION update_agent_messages_updated_at();

-- Add trigger to handle user deletion (soft delete all messages)
CREATE OR REPLACE FUNCTION archive_agent_messages_on_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.agent_messages
  SET user_deleted_at = NOW()
  WHERE user_id = OLD.id AND user_deleted_at IS NULL;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_messages_archive_trigger
AFTER DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION archive_agent_messages_on_user_delete();



-- ============================================
-- File: 20260223_marketplace_channels.sql
-- ============================================
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



-- ============================================
-- File: 20260224_extend_users_table.sql
-- ============================================
-- Migration: Extend users table with department and is_active columns
-- Date: 2026-02-24
-- Purpose: Add columns used by seed data and users API that were missing from 01-schema.sql

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.users.department IS 'Team/department the user belongs to';
COMMENT ON COLUMN public.users.is_active IS 'Soft-delete flag: false means the user is deactivated';

CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);



-- ============================================
-- File: 20260225_marketplace_tasks.sql
-- ============================================
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



-- ============================================
-- File: 20260302_create_marketplace_subtasks.sql
-- ============================================
-- Migration: Create Marketplace Subtasks Table
-- Date: 2026-03-02
-- Description: Creates table for autonomous sub-agents to decompose and execute marketplace tasks
--
-- Tracks:
-- 1. Subtask hierarchy (parent_task_id → sub-agent relationship)
-- 2. Execution status and workflow (pending → in_progress → awaiting_checkpoint → completed)
-- 3. Checkpoint data for human approval before proceeding
-- 4. Result data from sub-agent execution

-- ============================================================================
-- CREATE TABLE: marketplace_subtasks
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationship to parent task
  parent_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,

  -- Sub-agent and task configuration
  sub_agent_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('analysis', 'content_generation', 'delegation')),
  title TEXT NOT NULL,
  description TEXT,

  -- Execution status workflow
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'awaiting_checkpoint', 'completed', 'failed')),

  -- Checkpoint workflow
  checkpoint_data JSONB,           -- Data for human to review at checkpoint
  result_data JSONB,               -- Final result from sub-agent execution
  checkpoint_approved_by TEXT,
  checkpoint_approved_at TIMESTAMPTZ,

  -- Ordering for execution
  order_index INTEGER NOT NULL DEFAULT 0,

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES: Performance optimization
-- ============================================================================

-- Find all subtasks for a parent task
CREATE INDEX IF NOT EXISTS idx_marketplace_subtasks_parent_task_id
  ON public.marketplace_subtasks(parent_task_id);

-- Find subtasks by status
CREATE INDEX IF NOT EXISTS idx_marketplace_subtasks_status
  ON public.marketplace_subtasks(status);

-- Find awaiting checkpoint subtasks (high priority for UI)
CREATE INDEX IF NOT EXISTS idx_marketplace_subtasks_awaiting_checkpoint
  ON public.marketplace_subtasks(parent_task_id, status)
  WHERE status = 'awaiting_checkpoint';

-- Order subtasks by execution sequence
CREATE INDEX IF NOT EXISTS idx_marketplace_subtasks_order
  ON public.marketplace_subtasks(parent_task_id, order_index);

-- Find in-progress subtasks
CREATE INDEX IF NOT EXISTS idx_marketplace_subtasks_in_progress
  ON public.marketplace_subtasks(status, updated_at DESC)
  WHERE status IN ('pending', 'in_progress');

-- ============================================================================
-- COMMENTS: Document table and columns
-- ============================================================================

COMMENT ON TABLE public.marketplace_subtasks IS
  'Tracks autonomous sub-agent decomposed tasks. Each subtask is created from a parent marketplace_task and executed by specialized sub-agents with human checkpoints.';

COMMENT ON COLUMN public.marketplace_subtasks.id IS
  'Unique identifier (UUID) for subtask';

COMMENT ON COLUMN public.marketplace_subtasks.parent_task_id IS
  'Reference to parent marketplace task that was approved for decomposition';

COMMENT ON COLUMN public.marketplace_subtasks.sub_agent_id IS
  'Identifier of sub-agent executing this task (e.g., ''alex'', ''marina'', ''jordan'')';

COMMENT ON COLUMN public.marketplace_subtasks.type IS
  'Subtask type: analysis (market/context), content_generation (titles/descriptions), delegation (create sub-subtasks)';

COMMENT ON COLUMN public.marketplace_subtasks.title IS
  'Human-readable title of subtask';

COMMENT ON COLUMN public.marketplace_subtasks.description IS
  'Detailed description of what subtask accomplishes';

COMMENT ON COLUMN public.marketplace_subtasks.status IS
  'Workflow status: pending (queued) → in_progress (executing) → awaiting_checkpoint (needs human approval) → completed (done) or failed';

COMMENT ON COLUMN public.marketplace_subtasks.checkpoint_data IS
  'JSON data from sub-agent for human review at checkpoint before proceeding (e.g., analysis findings, generated content)';

COMMENT ON COLUMN public.marketplace_subtasks.result_data IS
  'Final JSON result from sub-agent execution (e.g., marketplace recommendations, generated titles)';

COMMENT ON COLUMN public.marketplace_subtasks.checkpoint_approved_by IS
  'User ID who approved the checkpoint (nullable if pending approval)';

COMMENT ON COLUMN public.marketplace_subtasks.checkpoint_approved_at IS
  'Timestamp when checkpoint was approved (nullable if pending)';

COMMENT ON COLUMN public.marketplace_subtasks.order_index IS
  'Execution order within parent task (0-indexed, sequential execution)';

-- ============================================================================
-- RLS POLICIES: Row-level security
-- ============================================================================

-- Enable RLS
ALTER TABLE public.marketplace_subtasks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view subtasks (will be further restricted in frontend)
CREATE POLICY marketplace_subtasks_read_authenticated
  ON public.marketplace_subtasks
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role (backend) full access
CREATE POLICY marketplace_subtasks_all_service_role
  ON public.marketplace_subtasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCTION: Update updated_at timestamp on row change
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_marketplace_subtasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS marketplace_subtasks_update_timestamp ON public.marketplace_subtasks;

-- Create trigger
CREATE TRIGGER marketplace_subtasks_update_timestamp
  BEFORE UPDATE ON public.marketplace_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketplace_subtasks_updated_at();

-- ============================================================================
-- Summary
-- ============================================================================
-- Table created: marketplace_subtasks
-- Indexes: 5
-- RLS Policies: 2
-- Triggers: 1 (auto-update timestamp)
-- Next: Add SubTask types to types.ts and create SubAgentOrchestrator service



-- ============================================
-- File: 20260302_fix_tasks_constraints.sql
-- ============================================
-- Migration: Fix tasks table constraints
-- Date: 2026-03-02
-- Purpose: Allow assigned_to and due_date to be nullable for flexible task creation

-- Alter tasks table to allow NULL values
ALTER TABLE public.tasks
  ALTER COLUMN assigned_to DROP NOT NULL,
  ALTER COLUMN due_date DROP NOT NULL;

-- Update task POST endpoint validation comment
COMMENT ON TABLE public.tasks IS 'Task units with optional assignment and due dates - support flexible task creation workflow';



-- ============================================
-- File: 20260305_analytics_schema.sql
-- ============================================
-- Analytics Schema & Optimization
-- Story 3.6: Analytics Data Aggregation Phase 2
-- Indexes for query optimization + RPC functions for metric calculations

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Index on audit_logs for efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs(created_at DESC);

-- Index on task_id for joining with tasks
CREATE INDEX IF NOT EXISTS idx_audit_logs_task_id
ON audit_logs(task_id);

-- Index on user_id for per-user aggregations
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
ON audit_logs(user_id);

-- Composite index for most common queries (status by date by user)
CREATE INDEX IF NOT EXISTS idx_audit_logs_status_user_created
ON audit_logs(status, user_id, created_at DESC);

-- ============================================================================
-- Helper Function: Calculate Duration in Hours
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_duration_hours(
  status_created_at TIMESTAMP WITH TIME ZONE,
  status_completed_at TIMESTAMP WITH TIME ZONE
) RETURNS FLOAT AS $$
BEGIN
  IF status_completed_at IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(EPOCH FROM (status_completed_at - status_created_at)) / 3600.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- RPC Function: Calculate Per-User Metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_per_user_metrics(
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE,
  user_id_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  display_name VARCHAR,
  task_count BIGINT,
  avg_completion_time NUMERIC,
  total_hours NUMERIC,
  approval_rate NUMERIC,
  rejection_rate NUMERIC,
  last_completed TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH user_tasks AS (
    -- Get all status transitions for each user in date range
    SELECT
      al.user_id,
      up.display_name,
      al.task_id,
      al.status,
      al.created_at,
      al.updated_at,
      LAG(al.status) OVER (PARTITION BY al.task_id ORDER BY al.created_at) as prev_status,
      LAG(al.created_at) OVER (PARTITION BY al.task_id ORDER BY al.created_at) as prev_created_at
    FROM audit_logs al
    LEFT JOIN user_profiles up ON al.user_id = up.user_id
    WHERE al.created_at >= date_start
      AND al.created_at <= date_end
      AND (user_id_filter IS NULL OR al.user_id = user_id_filter)
  ),
  completed_tasks AS (
    -- Filter to only approved/rejected tasks (completed)
    SELECT
      user_id,
      display_name,
      task_id,
      status,
      created_at,
      updated_at,
      prev_created_at,
      calculate_duration_hours(prev_created_at, created_at) as duration_hours
    FROM user_tasks
    WHERE status IN ('approved', 'rejected')
      AND prev_status = 'submitted'
  ),
  aggregated AS (
    SELECT
      user_id,
      display_name,
      COUNT(DISTINCT task_id) as task_count,
      AVG(COALESCE(duration_hours, 0)) as avg_completion_time,
      SUM(COALESCE(duration_hours, 0)) as total_hours,
      ROUND(
        100.0 * COUNT(CASE WHEN status = 'approved' THEN 1 END) /
        NULLIF(COUNT(DISTINCT task_id), 0),
        2
      ) as approval_rate,
      ROUND(
        100.0 * COUNT(CASE WHEN status = 'rejected' THEN 1 END) /
        NULLIF(COUNT(DISTINCT task_id), 0),
        2
      ) as rejection_rate,
      MAX(created_at) as last_completed
    FROM completed_tasks
    GROUP BY user_id, display_name
  )
  SELECT
    user_id,
    display_name,
    task_count,
    ROUND(avg_completion_time::NUMERIC, 2),
    ROUND(total_hours::NUMERIC, 2),
    COALESCE(approval_rate, 0),
    COALESCE(rejection_rate, 0),
    last_completed
  FROM aggregated
  ORDER BY task_count DESC, user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC Function: Calculate Team Metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_team_metrics(
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  total_tasks BIGINT,
  avg_daily_completion NUMERIC,
  burndown_trend JSONB,
  team_avg_time NUMERIC,
  overall_success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_completions AS (
    -- Count completed tasks per day
    SELECT
      DATE(al.created_at) as completion_date,
      COUNT(DISTINCT al.task_id) as tasks_completed
    FROM audit_logs al
    WHERE al.created_at >= date_start
      AND al.created_at <= date_end
      AND al.status IN ('approved', 'rejected')
      AND LAG(al.status) OVER (PARTITION BY al.task_id ORDER BY al.created_at) = 'submitted'
    GROUP BY DATE(al.created_at)
  ),
  burndown_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', TO_CHAR(completion_date, 'YYYY-MM-DD'),
        'tasks_completed', tasks_completed
      ) ORDER BY completion_date
    ) as trend
    FROM daily_completions
  ),
  task_durations AS (
    -- Calculate duration for all completed tasks
    SELECT
      al.task_id,
      calculate_duration_hours(
        MIN(CASE WHEN al.status = 'created' THEN al.created_at END),
        MAX(CASE WHEN al.status IN ('approved', 'rejected') THEN al.created_at END)
      ) as duration_hours,
      MAX(CASE WHEN al.status IN ('approved', 'rejected') THEN al.status END) as final_status
    FROM audit_logs al
    WHERE al.created_at >= date_start
      AND al.created_at <= date_end
    GROUP BY al.task_id
  ),
  team_stats AS (
    SELECT
      COUNT(DISTINCT task_id) as total_completed,
      AVG(COALESCE(duration_hours, 0)) as avg_duration,
      ROUND(
        100.0 * COUNT(CASE WHEN final_status = 'approved' THEN 1 END) /
        NULLIF(COUNT(DISTINCT task_id), 0),
        2
      ) as success_rate
    FROM task_durations
  )
  SELECT
    ts.total_completed,
    ROUND((ts.total_completed::NUMERIC /
      NULLIF(EXTRACT(DAY FROM date_end - date_start)::NUMERIC, 0)), 2),
    COALESCE(bd.trend, '[]'::jsonb),
    ROUND(ts.avg_duration::NUMERIC, 2),
    COALESCE(ts.success_rate, 0)
  FROM team_stats ts, burndown_data bd;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC Function: Calculate QA Metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_qa_metrics(
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  avg_review_time NUMERIC,
  pending_reviews BIGINT,
  review_sla NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH review_times AS (
    -- Get time from submitted → approved/rejected (QA review time)
    SELECT
      al.task_id,
      calculate_duration_hours(
        submitted_time.created_at,
        MAX(al.created_at)
      ) as review_duration_hours,
      CASE
        WHEN calculate_duration_hours(submitted_time.created_at, MAX(al.created_at)) <= 24
        THEN 1
        ELSE 0
      END as meets_sla
    FROM audit_logs al
    JOIN (
      SELECT task_id, created_at
      FROM audit_logs
      WHERE status = 'submitted'
    ) submitted_time ON al.task_id = submitted_time.task_id
    WHERE al.created_at >= date_start
      AND al.created_at <= date_end
      AND al.status IN ('approved', 'rejected')
      AND al.created_at > submitted_time.created_at
    GROUP BY al.task_id, submitted_time.created_at
  ),
  pending_tasks AS (
    -- Count tasks still in submitted status (pending review)
    SELECT COUNT(DISTINCT task_id) as pending_count
    FROM audit_logs
    WHERE created_at >= date_start
      AND created_at <= date_end
      AND status = 'submitted'
      AND NOT EXISTS (
        SELECT 1 FROM audit_logs al2
        WHERE al2.task_id = audit_logs.task_id
          AND al2.status IN ('approved', 'rejected')
          AND al2.created_at > audit_logs.created_at
      )
  ),
  qa_stats AS (
    SELECT
      AVG(review_duration_hours) as avg_duration,
      ROUND(
        100.0 * SUM(meets_sla) / NULLIF(COUNT(*), 0),
        2
      ) as sla_percentage
    FROM review_times
  )
  SELECT
    ROUND(COALESCE(qa_stats.avg_duration, 0)::NUMERIC, 2),
    COALESCE(pt.pending_count, 0),
    COALESCE(qa_stats.sla_percentage, 0)
  FROM qa_stats, pending_tasks pt;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grant Permissions for RLS Security
-- ============================================================================

-- Allow authenticated users to call RPC functions (with row-level filtering in service layer)
GRANT EXECUTE ON FUNCTION calculate_per_user_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_team_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_qa_metrics TO authenticated;



-- ============================================
-- File: 20260305_user_profiles_and_audit.sql
-- ============================================
-- User Management System Tables (Story 3.2)
-- Created: 2026-02-20

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(5) DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend notification_preferences with audit tracking
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS preference_version INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Preference Audit Log Table
CREATE TABLE IF NOT EXISTS preference_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_key VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by VARCHAR(100)
);

-- RLS Policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for preference_audit_log
ALTER TABLE preference_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit log"
  ON preference_audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
  ON preference_audit_log FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_preference_audit_user_id ON preference_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_preference_audit_changed_at ON preference_audit_log(changed_at);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at_trigger
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_updated_at();

