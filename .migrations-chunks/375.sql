CREATE POLICY "Service role can manage email tracking"
  ON email_tracking
  FOR ALL
  USING (auth.role() = 'service_role');