CREATE POLICY "Head can approve/reject plans"
  ON public.marketplace_plans FOR UPDATE
  USING (auth.jwt()->>'role' IN ('head', 'admin'))
  WITH CHECK (
    (status IN ('approved', 'rejected') AND (approved_by = auth.uid() OR auth.jwt()->>'role' = 'admin'))
  );