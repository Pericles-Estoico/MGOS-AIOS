create table if not exists report_cache (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  data jsonb not null,
  generated_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '1 hour'),
  unique (report_id)
);