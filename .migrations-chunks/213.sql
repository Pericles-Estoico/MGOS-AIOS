create index if not exists idx_task_comments_task_id_created_at
  on task_comments (task_id, created_at desc);