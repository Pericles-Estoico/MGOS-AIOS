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