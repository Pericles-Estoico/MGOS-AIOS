CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_name VARCHAR(100) NOT NULL, -- 'Alex', 'Marina', 'Sunny', etc
  channel VARCHAR(50), -- 'amazon', 'mercadolivre', etc (optional)

  user_message TEXT NOT NULL,
  agent_response TEXT,
  response_metadata JSONB, -- Additional data: tokens used, model, etc

  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, cancelled
  error_message TEXT,

  message_type VARCHAR(50) DEFAULT 'general', -- 'general', 'analysis', 'task_creation', 'question'

  analysis_id UUID REFERENCES public.marketplace_plans(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_deleted_at TIMESTAMP -- Soft delete for privacy
);