CREATE INDEX IF NOT EXISTS idx_marketplace_subtasks_awaiting_checkpoint
  ON public.marketplace_subtasks(parent_task_id, status)
  WHERE status = 'awaiting_checkpoint';