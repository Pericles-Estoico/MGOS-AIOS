CREATE TABLE IF NOT EXISTS public.marketplace_subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  parent_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,

  sub_agent_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('analysis', 'content_generation', 'delegation')),
  title TEXT NOT NULL,
  description TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'awaiting_checkpoint', 'completed', 'failed')),

  checkpoint_data JSONB,           -- Data for human to review at checkpoint
  result_data JSONB,               -- Final result from sub-agent execution
  checkpoint_approved_by TEXT,
  checkpoint_approved_at TIMESTAMPTZ,

  order_index INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);