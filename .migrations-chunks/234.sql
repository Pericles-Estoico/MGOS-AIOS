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