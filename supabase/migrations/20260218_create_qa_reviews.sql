-- Create qa_reviews table for QA review system (Story 3.3)
create table if not exists qa_reviews (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  reviewer_id uuid not null references users(id),
  action text not null check (action in ('approved', 'rejected', 'requested_changes')),
  feedback text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add index for task_id lookups
create index if not exists idx_qa_reviews_task_id on qa_reviews(task_id);
create index if not exists idx_qa_reviews_reviewer_id on qa_reviews(reviewer_id);
create index if not exists idx_qa_reviews_created_at on qa_reviews(created_at desc);

-- Enable RLS
alter table qa_reviews enable row level security;

-- RLS: QA members can view reviews for their organization
create policy "QA can view reviews"
  on qa_reviews
  for select
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('qa', 'admin', 'head')
    )
  );

-- RLS: QA members can create reviews
create policy "QA can create reviews"
  on qa_reviews
  for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('qa', 'admin', 'head')
    )
  );

-- Executors can view reviews for their tasks
create policy "Task executor can view reviews"
  on qa_reviews
  for select
  using (
    exists (
      select 1 from tasks t
      where t.id = task_id
      and t.assigned_to = auth.uid()
    )
  );

-- Add qa_review_count column to tasks table for denormalization
alter table tasks add column if not exists qa_review_count integer default 0;
