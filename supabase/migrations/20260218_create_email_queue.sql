-- Email Queue System (Story 4.1)
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

create index if not exists idx_email_queue_status on email_queue(status);
create index if not exists idx_email_queue_user_id on email_queue(user_id);
create index if not exists idx_email_queue_created_at on email_queue(created_at desc);
create index if not exists idx_email_queue_pending on email_queue(status, retry_count) where status = 'pending';

-- Email tracking table
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

create index if not exists idx_email_tracking_queue_id on email_tracking(queue_id);
create index if not exists idx_email_tracking_opened on email_tracking(opened);

-- User email preferences (update existing table)
alter table notification_preferences add column if not exists email_digest_enabled boolean default true;
alter table notification_preferences add column if not exists email_digest_frequency text default 'daily';
alter table notification_preferences add column if not exists quiet_hours_start time;
alter table notification_preferences add column if not exists quiet_hours_end time;
alter table notification_preferences add column if not exists unsubscribed_from_all boolean default false;

-- Email template table
create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  subject text not null,
  html_content text not null,
  text_content text,
  variables text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_email_templates_name on email_templates(name);

-- Enable RLS
alter table email_queue enable row level security;
alter table email_tracking enable row level security;
alter table email_templates enable row level security;

-- RLS Policies
create policy "Users can view own email queue"
  on email_queue
  for select
  using (user_id = auth.uid());

create policy "Admins can view all email queue"
  on email_queue
  for select
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('admin', 'head')
    )
  );

-- Trigger to update updated_at
create or replace function update_email_queue_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_email_queue_timestamp_trigger on email_queue;
create trigger update_email_queue_timestamp_trigger
  before update on email_queue
  for each row
  execute function update_email_queue_timestamp();
