-- Migration: Fix tasks table constraints
-- Date: 2026-03-02
-- Purpose: Allow assigned_to and due_date to be nullable for flexible task creation

-- Alter tasks table to allow NULL values
ALTER TABLE public.tasks
  ALTER COLUMN assigned_to DROP NOT NULL,
  ALTER COLUMN due_date DROP NOT NULL;

-- Update task POST endpoint validation comment
COMMENT ON TABLE public.tasks IS 'Task units with optional assignment and due dates - support flexible task creation workflow';
