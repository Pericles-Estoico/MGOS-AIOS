CREATE POLICY "See logs for accessible tasks"
  ON public.audit_logs FOR SELECT
  USING (
    entity_type != 'task' -- Non-task logs visible to appropriate roles
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = audit_logs.entity_id
      AND (
        t.assigned_to = auth.uid()
        OR t.created_by = auth.uid()
        OR auth.jwt()->>'role' IN ('admin', 'head', 'qa')
      )
    )
  );