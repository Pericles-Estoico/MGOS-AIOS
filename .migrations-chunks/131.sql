create table if not exists task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default now()
);