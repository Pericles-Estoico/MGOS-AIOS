CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);