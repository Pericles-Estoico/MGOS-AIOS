create table if not exists user_presence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  status text default 'online' check (status in ('online', 'offline', 'idle')),
  last_activity timestamp with time zone default now(),
  is_typing boolean default false,
  typing_at timestamp with time zone
);