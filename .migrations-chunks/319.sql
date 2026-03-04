create policy "Users can create searches"
  on search_analytics
  for insert
  with check (user_id = auth.uid());