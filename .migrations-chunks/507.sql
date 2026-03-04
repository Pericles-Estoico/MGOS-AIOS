CREATE INDEX IF NOT EXISTS idx_marketplace_subtasks_parent_task_id
  ON public.marketplace_subtasks(parent_task_id);