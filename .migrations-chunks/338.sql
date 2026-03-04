ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS ai_change_type VARCHAR(50) DEFAULT NULL
  CHECK (ai_change_type IS NULL OR ai_change_type IN ('algorithm', 'ads', 'content', 'policies', 'features'));