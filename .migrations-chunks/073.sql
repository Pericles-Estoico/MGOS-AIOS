CREATE POLICY "Update review - reviewer or admin"
  ON public.qa_reviews FOR UPDATE
  USING (
    reviewed_by = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );