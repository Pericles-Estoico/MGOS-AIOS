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