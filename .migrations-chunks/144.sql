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