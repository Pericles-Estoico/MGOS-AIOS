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