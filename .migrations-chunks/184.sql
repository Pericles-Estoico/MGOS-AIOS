create policy "Users can view own email queue"
  on email_queue
  for select
  using (user_id = auth.uid());