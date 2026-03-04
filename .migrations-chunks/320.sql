create policy "Admins can view all analytics"
  on search_analytics
  for select
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('admin', 'head')
    )
  );