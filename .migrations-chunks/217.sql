create index if not exists idx_time_logs_user_date
  on time_logs (user_id, log_date desc);