create policy "Users can edit own comments"
  on task_comments
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());