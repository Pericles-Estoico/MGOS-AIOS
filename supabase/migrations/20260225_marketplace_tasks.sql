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
