create index if not exists idx_tasks_created_by_created_at
  on tasks (created_by, created_at desc);