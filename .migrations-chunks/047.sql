CREATE POLICY "Heads see created and assigned"
  ON public.tasks FOR SELECT
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR auth.jwt()->>'role' = 'head'
  );