CREATE POLICY "admins_can_view_sprints" ON sprints
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'head');