create policy "Users can manage own presence"
  on user_presence
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());