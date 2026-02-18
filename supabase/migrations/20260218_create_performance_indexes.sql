-- Performance Optimization: Index Strategy (Story 4.3)

-- Tasks table performance indexes
create index if not exists idx_tasks_status_assigned_to
  on tasks (status, assigned_to)
  where status != 'completed';

create index if not exists idx_tasks_sprint_status
  on tasks (sprint_id, status);

create index if not exists idx_tasks_created_by_created_at
  on tasks (created_by, created_at desc);

create index if not exists idx_tasks_due_date_status
  on tasks (due_date, status)
  where due_date is not null;

-- QA Reviews table indexes
create index if not exists idx_qa_reviews_task_status
  on qa_reviews (task_id, status);

create index if not exists idx_qa_reviews_created_at
  on qa_reviews (created_at desc);

-- Comments table indexes
create index if not exists idx_task_comments_task_id_created_at
  on task_comments (task_id, created_at desc);

-- Activity table indexes
create index if not exists idx_task_activity_task_action_created
  on task_activity (task_id, action, created_at desc);

-- Email queue optimization
create index if not exists idx_email_queue_status_created_at
  on email_queue (status, created_at)
  where status = 'pending';

create index if not exists idx_email_queue_user_status
  on email_queue (user_id, status);

-- Analytics indexes
create index if not exists idx_time_logs_user_date
  on time_logs (user_id, log_date desc);

create index if not exists idx_time_logs_task_date
  on time_logs (task_id, log_date);

-- Full-text search optimization
create index if not exists idx_tasks_search_vector
  on tasks using gin(search_vector);

-- Composite indexes for common queries
create index if not exists idx_tasks_assigned_sprint_status
  on tasks (assigned_to, sprint_id, status);

create index if not exists idx_tasks_priority_due_status
  on tasks (priority, due_date, status);

-- Vacuum and analyze after creating indexes
vacuum analyze tasks;
vacuum analyze qa_reviews;
vacuum analyze task_comments;
vacuum analyze task_activity;
vacuum analyze email_queue;
vacuum analyze time_logs;
