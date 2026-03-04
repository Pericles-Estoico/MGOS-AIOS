create index if not exists idx_time_logs_task_date
  on time_logs (task_id, log_date);