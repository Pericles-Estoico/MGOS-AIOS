CREATE POLICY "Update task - creator or admin"
  ON public.tasks FOR UPDATE
  USING (created_by = auth.uid() OR auth.jwt()->>'role' = 'admin');