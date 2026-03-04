create index if not exists idx_email_queue_user_status
  on email_queue (user_id, status);