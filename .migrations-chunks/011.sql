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