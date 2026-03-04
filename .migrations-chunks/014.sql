CREATE TABLE IF NOT EXISTS public.qa_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reviewed_by UUID NOT NULL REFERENCES public.users(id),
  status VARCHAR(50) NOT NULL
    CHECK (status IN ('aprovado', 'reprovado')),
  reason TEXT NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);