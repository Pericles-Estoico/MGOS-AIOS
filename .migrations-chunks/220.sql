create index if not exists idx_tasks_assigned_sprint_status
  on tasks (assigned_to, sprint_id, status);