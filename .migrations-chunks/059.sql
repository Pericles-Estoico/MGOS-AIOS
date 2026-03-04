CREATE POLICY "Admins see all evidence"
  ON public.evidence FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');