create index if not exists idx_tasks_sprint_status
  on tasks (sprint_id, status);