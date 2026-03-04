create policy "Users can view own metrics"
  on user_metrics
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('admin', 'head')
    )
  );