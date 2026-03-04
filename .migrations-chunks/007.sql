CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'a_fazer'
    CHECK (status IN ('a_fazer', 'fazendo', 'enviado_qa', 'aprovado', 'concluido')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  assigned_to UUID NOT NULL REFERENCES public.users(id),
  created_by UUID NOT NULL REFERENCES public.users(id),
  due_date DATE NOT NULL,
  due_time TIME,
  frente VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);