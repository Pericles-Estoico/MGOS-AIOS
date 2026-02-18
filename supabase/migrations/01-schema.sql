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
