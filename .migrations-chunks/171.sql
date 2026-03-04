create table if not exists email_tracking (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references email_queue(id) on delete cascade,
  opened boolean default false,
  opened_at timestamp with time zone,
  clicked boolean default false,
  clicked_at timestamp with time zone,
  bounced boolean default false,
  bounced_at timestamp with time zone,
  unsubscribed boolean default false,
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);