-- Migration: Fix/create marketplace_tasks table
-- Date: 2026-07-11
-- Purpose: Table was not created correctly (public.users FK caused failure).
--          Drop and recreate without problematic FK references.

-- Drop if exists (from failed previous migration)
DROP TABLE IF EXISTS public.marketplace_tasks CASCADE;

-- Create clean table without public.users FK constraints
CREATE TABLE public.marketplace_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Task content
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category VARCHAR(50) NOT NULL DEFAULT 'optimization'
    CHECK (category IN ('optimization', 'best-practice', 'scaling', 'analysis')),

  -- Marketplace routing
  marketplace VARCHAR(50) NOT NULL
    CHECK (marketplace IN ('amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway', 'general')),

  -- Agent metadata
  created_by_agent VARCHAR(50) NOT NULL DEFAULT 'nexo'
    CHECK (created_by_agent IN ('alex', 'marina', 'sunny', 'tren', 'viral', 'premium', 'nexo')),
  source_type VARCHAR(50) NOT NULL DEFAULT 'ai_generated'
    CHECK (source_type IN ('ai_generated', 'manual', 'scheduled')),
  plan_id VARCHAR(100),

  -- Status workflow
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'awaiting_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled')),

  -- Human approval (UUID sem FK para evitar problemas de referência)
  admin_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Execution tracking (UUID sem FK)
  assigned_to UUID,
  assigned_by UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
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

  -- Extra metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_mp_tasks_status      ON public.marketplace_tasks(status);
CREATE INDEX idx_mp_tasks_marketplace ON public.marketplace_tasks(marketplace);
CREATE INDEX idx_mp_tasks_agent       ON public.marketplace_tasks(created_by_agent);
CREATE INDEX idx_mp_tasks_plan        ON public.marketplace_tasks(plan_id);
CREATE INDEX idx_mp_tasks_approved    ON public.marketplace_tasks(admin_approved);
CREATE INDEX idx_mp_tasks_created_at  ON public.marketplace_tasks(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_marketplace_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mp_tasks_updated_at ON public.marketplace_tasks;
CREATE TRIGGER trigger_mp_tasks_updated_at
  BEFORE UPDATE ON public.marketplace_tasks
  FOR EACH ROW EXECUTE FUNCTION update_marketplace_tasks_updated_at();

-- Desabilitar RLS (acesso via service role key)
ALTER TABLE public.marketplace_tasks DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.marketplace_tasks IS 'AI-generated marketplace optimization tasks from NEXO orchestrator';
