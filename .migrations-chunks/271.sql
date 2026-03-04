create policy "Users can view team metrics"
  on team_metrics
  for select
  using (true);