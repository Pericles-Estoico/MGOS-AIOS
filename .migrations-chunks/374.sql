CREATE POLICY "Service role can manage email queue"
  ON email_queue
  FOR ALL
  USING (auth.role() = 'service_role');