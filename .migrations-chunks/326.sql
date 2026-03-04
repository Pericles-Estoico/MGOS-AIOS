CREATE POLICY "admins_can_create_sprints" ON sprints
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');