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
