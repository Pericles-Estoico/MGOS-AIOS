create policy "Users can view presence"
  on user_presence
  for select
  using (true);