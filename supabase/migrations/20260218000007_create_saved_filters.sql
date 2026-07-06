-- Create saved filters table (Phase 3)
create table if not exists saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  description text,
  filters jsonb not null,
  is_shared boolean default false,
  is_default boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes
create index if not exists idx_saved_filters_user_id on saved_filters(user_id);
create index if not exists idx_saved_filters_is_shared on saved_filters(is_shared);
create index if not exists idx_saved_filters_is_default on saved_filters(is_default);

-- Enable RLS
alter table saved_filters enable row level security;

-- RLS: Users can view/edit their own filters
create policy "Users can manage own filters"
  on saved_filters
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- RLS: Users can view shared filters from others
create policy "Users can view shared filters"
  on saved_filters
  for select
  using (is_shared = true);

-- Create filter_usage table to track which filters are used most
create table if not exists filter_usage (
  id uuid primary key default gen_random_uuid(),
  filter_id uuid not null references saved_filters(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  used_at timestamp with time zone default now()
);

create index if not exists idx_filter_usage_filter_id on filter_usage(filter_id);
create index if not exists idx_filter_usage_user_id on filter_usage(user_id);
create index if not exists idx_filter_usage_used_at on filter_usage(used_at desc);

-- Enable RLS on filter_usage
alter table filter_usage enable row level security;

-- RLS: Users can only see their own usage
create policy "Users can track own filter usage"
  on filter_usage
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
