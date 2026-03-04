CREATE POLICY "Admins see all tasks"
  ON public.tasks FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');