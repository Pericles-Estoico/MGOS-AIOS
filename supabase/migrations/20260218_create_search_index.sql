-- Create full-text search infrastructure for tasks (Story 3.5)

-- Add tsvector column for search_vector
alter table tasks add column if not exists search_vector tsvector;

-- Create index for fast full-text search
create index if not exists idx_tasks_search_vector on tasks using gin(search_vector);

-- Create function to update search_vector automatically
create or replace function update_tasks_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    to_tsvector('portuguese', coalesce(new.title, '')) ||
    to_tsvector('portuguese', coalesce(new.description, ''));
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update search_vector on insert/update
drop trigger if exists update_tasks_search_vector_trigger on tasks;
create trigger update_tasks_search_vector_trigger
  before insert or update on tasks
  for each row
  execute function update_tasks_search_vector();

-- Backfill existing tasks with search_vector
update tasks set search_vector =
  to_tsvector('portuguese', coalesce(title, '')) ||
  to_tsvector('portuguese', coalesce(description, ''))
where search_vector is null;

-- Create search_analytics table for tracking searches
create table if not exists search_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  search_query text not null,
  result_count integer,
  filters jsonb,
  execution_time_ms integer,
  created_at timestamp with time zone default now()
);

-- Create index for analytics queries
create index if not exists idx_search_analytics_user_id on search_analytics(user_id);
create index if not exists idx_search_analytics_created_at on search_analytics(created_at desc);
create index if not exists idx_search_analytics_query on search_analytics(search_query);

-- Enable RLS on analytics table
alter table search_analytics enable row level security;

-- RLS: Users can only view their own searches
create policy "Users can view own searches"
  on search_analytics
  for select
  using (user_id = auth.uid());

-- RLS: Users can insert their own searches
create policy "Users can create searches"
  on search_analytics
  for insert
  with check (user_id = auth.uid());

-- RLS: Only admins can view all analytics
create policy "Admins can view all analytics"
  on search_analytics
  for select
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('admin', 'head')
    )
  );
