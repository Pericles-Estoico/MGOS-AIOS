CREATE POLICY "Delete task - admin only"
  ON public.tasks FOR DELETE
  USING (auth.jwt()->>'role' = 'admin');