create policy "Users can view own searches"
  on search_analytics
  for select
  using (user_id = auth.uid());