CREATE POLICY "QA sees all for review"
  ON public.tasks FOR SELECT
  USING (auth.jwt()->>'role' = 'qa');