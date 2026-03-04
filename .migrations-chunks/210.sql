create index if not exists idx_tasks_due_date_status
  on tasks (due_date, status)
  where due_date is not null;