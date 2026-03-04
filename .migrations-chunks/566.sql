CREATE POLICY "Admins can view all audit logs"
  ON preference_audit_log FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');