-- Real-time Collaboration: Comments & Activity (Story 4.2)

create table if not exists task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  is_edited boolean default false,
  edited_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_task_comments_task_id on task_comments(task_id);
create index if not exists idx_task_comments_user_id on task_comments(user_id);
create index if not exists idx_task_comments_created_at on task_comments(created_at desc);

-- Activity log for real-time updates
create table if not exists task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists idx_task_activity_task_id on task_activity(task_id);
create index if not exists idx_task_activity_created_at on task_activity(created_at desc);

-- User presence tracking
create table if not exists user_presence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  status text default 'online' check (status in ('online', 'offline', 'idle')),
  last_activity timestamp with time zone default now(),
  is_typing boolean default false,
  typing_at timestamp with time zone
);

create index if not exists idx_user_presence_user_id on user_presence(user_id);
create index if not exists idx_user_presence_task_id on user_presence(task_id);

-- Enable RLS
alter table task_comments enable row level security;
alter table task_activity enable row level security;
alter table user_presence enable row level security;

-- RLS Policies for Comments
create policy "Users can view comments on tasks they have access to"
  on task_comments
  for select
  using (
    exists (
      select 1 from tasks t
      where t.id = task_id
      and (t.assigned_to = auth.uid() or exists (
        select 1 from users u
        where u.id = auth.uid()
        and u.role in ('admin', 'head', 'qa')
      ))
    )
  );

create policy "Users can create comments"
  on task_comments
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from tasks t
      where t.id = task_id
      and (t.assigned_to = auth.uid() or exists (
        select 1 from users u
        where u.id = auth.uid()
        and u.role in ('admin', 'head', 'qa')
      ))
    )
  );

create policy "Users can edit own comments"
  on task_comments
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own comments"
  on task_comments
  for delete
  using (user_id = auth.uid());

-- RLS for Activity
create policy "Users can view activity on accessible tasks"
  on task_activity
  for select
  using (
    exists (
      select 1 from tasks t
      where t.id = task_id
      and (t.assigned_to = auth.uid() or exists (
        select 1 from users u
        where u.id = auth.uid()
        and u.role in ('admin', 'head', 'qa')
      ))
    )
  );

-- RLS for Presence
create policy "Users can manage own presence"
  on user_presence
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can view presence"
  on user_presence
  for select
  using (true);

-- Trigger to update comment timestamp
create or replace function update_comment_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_comment_timestamp_trigger on task_comments;
create trigger update_comment_timestamp_trigger
  before update on task_comments
  for each row
  execute function update_comment_timestamp();

-- Trigger to auto-log activity
create or replace function log_task_activity()
returns trigger as $$
begin
  if (TG_OP = 'UPDATE') then
    if (old.status != new.status) then
      insert into task_activity (task_id, user_id, action, details)
      values (
        new.id,
        auth.uid(),
        'status_changed',
        jsonb_build_object('old_status', old.status, 'new_status', new.status)
      );
    end if;
    if (old.assigned_to != new.assigned_to) then
      insert into task_activity (task_id, user_id, action, details)
      values (
        new.id,
        auth.uid(),
        'reassigned',
        jsonb_build_object('old_assignee', old.assigned_to, 'new_assignee', new.assigned_to)
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists log_task_activity_trigger on tasks;
create trigger log_task_activity_trigger
  after update on tasks
  for each row
  execute function log_task_activity();

-- Enable realtime for WebSocket updates
alter publication supabase_realtime add table task_comments;
alter publication supabase_realtime add table task_activity;
alter publication supabase_realtime add table user_presence;
