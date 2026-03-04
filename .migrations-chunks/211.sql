create index if not exists idx_qa_reviews_task_status
  on qa_reviews (task_id, status);