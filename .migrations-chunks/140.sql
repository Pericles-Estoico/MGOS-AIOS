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