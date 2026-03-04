create table if not exists filter_usage (
  id uuid primary key default gen_random_uuid(),
  filter_id uuid not null references saved_filters(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  used_at timestamp with time zone default now()
);