create table if not exists team_metrics (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  sprint_id uuid references sprints(id) on delete cascade,
  total_tasks integer default 0,
  completed_tasks integer default 0,
  in_progress_tasks integer default 0,
  blocked_tasks integer default 0,
  avg_completion_time interval default null,
  quality_score numeric(5,2) default 0,
  captured_at timestamp with time zone default now()
);