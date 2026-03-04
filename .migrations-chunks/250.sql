create table if not exists user_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  sprint_id uuid references sprints(id) on delete cascade,
  tasks_completed integer default 0,
  tasks_in_progress integer default 0,
  avg_task_duration interval default null,
  quality_score numeric(5,2) default 0,
  productivity_index numeric(5,2) default 0,
  captured_at timestamp with time zone default now()
);