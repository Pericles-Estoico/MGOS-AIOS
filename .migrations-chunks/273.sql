create policy "Users can view task metrics they have access to"
  on task_metrics
  for select
  using (
    exists (
      select 1 from tasks t
      where t.id = task_id
      and (t.assigned_to = auth.uid() or t.created_by = auth.uid() or exists (
        select 1 from users u
        where u.id = auth.uid()
        and u.role in ('admin', 'head', 'qa')
      ))
    )
  );