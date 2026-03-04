CREATE POLICY "Heads see team time logs"
  ON public.time_logs FOR SELECT
  USING (
    auth.jwt()->>'role' = 'head'
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = time_logs.task_id
      AND t.created_by = auth.uid()
    )
  );