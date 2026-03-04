create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text not null check (type in ('sprint', 'team', 'individual', 'custom')),
  created_by uuid not null references users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);