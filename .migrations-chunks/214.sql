create index if not exists idx_task_activity_task_action_created
  on task_activity (task_id, action, created_at desc);