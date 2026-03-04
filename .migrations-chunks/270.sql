create policy "Users can view cached reports"
  on report_cache
  for select
  using (true);