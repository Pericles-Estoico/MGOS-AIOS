create index if not exists idx_tasks_status_assigned_to
  on tasks (status, assigned_to)
  where status != 'completed';