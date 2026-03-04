create table if not exists email_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  recipient_email text not null,
  subject text not null,
  template_name text not null,
  template_data jsonb,
  status text default 'pending' check (status in ('pending', 'sent', 'failed', 'bounced')),
  retry_count integer default 0,
  max_retries integer default 3,
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);