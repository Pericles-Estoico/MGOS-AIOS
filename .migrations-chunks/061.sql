CREATE POLICY "See evidence for accessible tasks"
  ON public.evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = evidence.task_id
      AND (
        t.assigned_to = auth.uid()
        OR t.created_by = auth.uid()
        OR auth.jwt()->>'role' IN ('admin', 'head', 'qa')
      )
    )
  );