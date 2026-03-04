create policy "Report creators can update their reports"
  on reports
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());