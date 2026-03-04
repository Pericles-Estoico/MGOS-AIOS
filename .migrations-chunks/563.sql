CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');