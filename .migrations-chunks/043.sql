CREATE POLICY "Users update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid() OR auth.jwt()->>'role' = 'admin');