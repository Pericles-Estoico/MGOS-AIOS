CREATE INDEX IF NOT EXISTS idx_tasks_ai_pending ON public.tasks(channel, admin_approved, created_at DESC)
  WHERE source_type = 'ai_generated' AND admin_approved = FALSE;