CREATE POLICY "Users can view own audit log"
  ON preference_audit_log FOR SELECT
  USING (auth.uid() = user_id);