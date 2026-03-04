create index if not exists idx_tasks_priority_due_status
  on tasks (priority, due_date, status);