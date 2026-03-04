CREATE POLICY "admins_can_delete_sprints" ON sprints
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');