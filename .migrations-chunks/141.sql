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