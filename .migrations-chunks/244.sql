CREATE POLICY "admins_can_create_reassignment_history" ON reassignment_history
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'head'));