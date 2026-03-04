CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES public.users(id),
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);