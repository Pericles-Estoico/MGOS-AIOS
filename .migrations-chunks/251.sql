create table if not exists task_metrics (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  estimate_hours numeric(10,2) default 0,
  actual_hours numeric(10,2) default 0,
  qa_feedback_count integer default 0,
  revision_count integer default 0,
  final_status text not null,
  captured_at timestamp with time zone default now()
);