create index if not exists idx_email_queue_status_created_at
  on email_queue (status, created_at)
  where status = 'pending';