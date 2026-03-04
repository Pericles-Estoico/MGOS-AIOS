CREATE POLICY "Insert evidence - executor only"
  ON public.evidence FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
      AND t.assigned_to = auth.uid()
    )
  );