create policy "Users can delete own comments"
  on task_comments
  for delete
  using (user_id = auth.uid());