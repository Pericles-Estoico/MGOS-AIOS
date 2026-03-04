create policy "Users can manage own filters"
  on saved_filters
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());