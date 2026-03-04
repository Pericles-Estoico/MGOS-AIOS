create policy "Users can view shared filters"
  on saved_filters
  for select
  using (is_shared = true);