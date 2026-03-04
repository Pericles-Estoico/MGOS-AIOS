create policy "Only admins can create reports"
  on reports
  for insert
  with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('admin', 'head')
    )
  );