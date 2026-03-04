create policy "Users can track own filter usage"
  on filter_usage
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());