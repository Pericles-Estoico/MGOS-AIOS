CREATE POLICY "Create task - admin or head"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.jwt()->>'role' IN ('admin', 'head'));