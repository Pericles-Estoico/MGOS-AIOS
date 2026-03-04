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