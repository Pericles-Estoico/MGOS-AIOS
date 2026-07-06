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
