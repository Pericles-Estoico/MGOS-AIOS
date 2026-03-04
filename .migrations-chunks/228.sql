create table if not exists qa_reviews (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  reviewer_id uuid not null references users(id),
  action text not null check (action in ('approved', 'rejected', 'requested_changes')),
  feedback text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);