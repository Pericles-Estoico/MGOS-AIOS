CREATE INDEX IF NOT EXISTS idx_marketplace_subtasks_in_progress
  ON public.marketplace_subtasks(status, updated_at DESC)
  WHERE status IN ('pending', 'in_progress');