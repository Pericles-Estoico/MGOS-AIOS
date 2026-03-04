CREATE POLICY "Delete evidence - submitter or admin"
  ON public.evidence FOR DELETE
  USING (
    submitted_by = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );