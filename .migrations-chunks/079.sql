CREATE POLICY "Admins see all time logs"
  ON public.time_logs FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');