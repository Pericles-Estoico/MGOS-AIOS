CREATE INDEX IF NOT EXISTS idx_marketplace_subtasks_order
  ON public.marketplace_subtasks(parent_task_id, order_index);