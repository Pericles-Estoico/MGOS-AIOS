ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'manual'
  CHECK (source_type IN ('manual', 'ai_generated'));