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
CREATE POLICY IF NOT EXISTS marketplace_subtasks_read_authenticated
  ON public.marketplace_subtasks
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role (backend) full access
CREATE POLICY IF NOT EXISTS marketplace_subtasks_all_service_role
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
