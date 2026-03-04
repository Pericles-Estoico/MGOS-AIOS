CREATE TABLE IF NOT EXISTS public.marketplace_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'optimization'
    CHECK (category IN ('optimization', 'best-practice', 'scaling', 'analysis')),

  marketplace VARCHAR(50) NOT NULL
    CHECK (marketplace IN ('amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway', 'general')),
  channel VARCHAR(50) GENERATED ALWAYS AS (marketplace) STORED,

  created_by_agent VARCHAR(50) NOT NULL
    CHECK (created_by_agent IN ('alex', 'marina', 'sunny', 'tren', 'viral', 'premium', 'nexo')),
  source_type VARCHAR(50) NOT NULL DEFAULT 'ai_generated'
    CHECK (source_type IN ('ai_generated', 'manual', 'scheduled')),
  plan_id VARCHAR(100),

  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'awaiting_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled')),

  admin_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES public.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  assigned_to UUID REFERENCES public.users(id),
  assigned_by UUID REFERENCES public.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.users(id),
  completion_notes TEXT,

  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  estimated_hours NUMERIC(5,1) DEFAULT 4.0,
  actual_hours NUMERIC(5,1),
  due_date DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,

  tags TEXT[],
  metadata JSONB DEFAULT '{}'
);