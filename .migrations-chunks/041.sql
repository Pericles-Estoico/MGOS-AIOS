CREATE POLICY "Users see own profile"
  ON public.users FOR SELECT
  USING (id = auth.uid() OR auth.jwt()->>'role' = 'admin');