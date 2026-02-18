-- Advanced Reporting System (Story 4.4)

-- Reports base table
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text not null check (type in ('sprint', 'team', 'individual', 'custom')),
  created_by uuid not null references users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Saved report configurations
create table if not exists report_configs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  filters jsonb default '{}',
  grouping text default 'day' check (grouping in ('hour', 'day', 'week', 'month')),
  metrics text[] default '{"completed_count", "avg_duration", "success_rate"}',
  chart_type text default 'line' check (chart_type in ('line', 'bar', 'pie', 'area')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Report cache (for quick access)
create table if not exists report_cache (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  data jsonb not null,
  generated_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '1 hour'),
  unique (report_id)
);

-- Team performance snapshots
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

-- Individual performance snapshots
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

-- Task metrics for drill-down reports
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

-- Create indexes
create index if not exists idx_reports_created_by on reports(created_by);
create index if not exists idx_reports_created_at on reports(created_at desc);
create index if not exists idx_report_cache_expires on report_cache(expires_at);
create index if not exists idx_team_metrics_sprint on team_metrics(sprint_id);
create index if not exists idx_team_metrics_captured on team_metrics(captured_at desc);
create index if not exists idx_user_metrics_sprint on user_metrics(sprint_id);
create index if not exists idx_user_metrics_user_captured on user_metrics(user_id, captured_at desc);
create index if not exists idx_task_metrics_task on task_metrics(task_id);
create index if not exists idx_task_metrics_captured on task_metrics(captured_at desc);

-- Enable RLS
alter table reports enable row level security;
alter table report_configs enable row level security;
alter table report_cache enable row level security;
alter table team_metrics enable row level security;
alter table user_metrics enable row level security;
alter table task_metrics enable row level security;

-- RLS Policies for Reports
create policy "Users can view all reports"
  on reports
  for select
  using (true);

create policy "Only admins can create reports"
  on reports
  for insert
  with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('admin', 'head')
    )
  );

create policy "Report creators can update their reports"
  on reports
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- RLS for Report Cache
create policy "Users can view cached reports"
  on report_cache
  for select
  using (true);

-- RLS for Team Metrics
create policy "Users can view team metrics"
  on team_metrics
  for select
  using (true);

-- RLS for User Metrics
create policy "Users can view own metrics"
  on user_metrics
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('admin', 'head')
    )
  );

-- RLS for Task Metrics
create policy "Users can view task metrics they have access to"
  on task_metrics
  for select
  using (
    exists (
      select 1 from tasks t
      where t.id = task_id
      and (t.assigned_to = auth.uid() or t.created_by = auth.uid() or exists (
        select 1 from users u
        where u.id = auth.uid()
        and u.role in ('admin', 'head', 'qa')
      ))
    )
  );

-- Trigger to clean up expired report cache
create or replace function cleanup_expired_reports()
returns void as $$
begin
  delete from report_cache
  where expires_at < now();
end;
$$ language plpgsql;

-- Function to capture team metrics snapshot
create or replace function capture_team_metrics(sprint_id_param uuid)
returns void as $$
declare
  total integer;
  completed integer;
  in_progress integer;
  blocked integer;
begin
  select
    count(*),
    count(*) filter (where status = 'approved'),
    count(*) filter (where status = 'in_progress'),
    count(*) filter (where status = 'blocked')
  into total, completed, in_progress, blocked
  from tasks
  where sprint_id = sprint_id_param;

  insert into team_metrics (sprint_id, total_tasks, completed_tasks, in_progress_tasks, blocked_tasks)
  values (sprint_id_param, total, completed, in_progress, blocked);
end;
$$ language plpgsql;

-- Function to capture user metrics snapshot
create or replace function capture_user_metrics(user_id_param uuid, sprint_id_param uuid)
returns void as $$
declare
  completed integer;
  in_progress integer;
begin
  select
    count(*) filter (where status = 'approved'),
    count(*) filter (where status = 'in_progress')
  into completed, in_progress
  from tasks
  where assigned_to = user_id_param
  and sprint_id = sprint_id_param;

  insert into user_metrics (user_id, sprint_id, tasks_completed, tasks_in_progress)
  values (user_id_param, sprint_id_param, completed, in_progress);
end;
$$ language plpgsql;
