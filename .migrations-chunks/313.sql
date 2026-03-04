create table if not exists search_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  search_query text not null,
  result_count integer,
  filters jsonb,
  execution_time_ms integer,
  created_at timestamp with time zone default now()
);