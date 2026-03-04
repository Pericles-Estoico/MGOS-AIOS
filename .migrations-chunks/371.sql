CREATE POLICY "Users can view own email queue"
  ON email_queue
  FOR SELECT
  USING (auth.uid() = user_id);