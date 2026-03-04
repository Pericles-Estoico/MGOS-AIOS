CREATE POLICY "See reviews for accessible tasks"
  ON public.qa_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = qa_reviews.task_id
      AND (
        t.assigned_to = auth.uid()
        OR t.created_by = auth.uid()
        OR auth.jwt()->>'role' IN ('admin', 'head', 'qa')
      )
    )
  );