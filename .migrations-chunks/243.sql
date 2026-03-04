CREATE POLICY "users_can_view_reassignment_history" ON reassignment_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = reassignment_history.task_id
      AND (
        t.assigned_to = auth.uid()
        OR auth.jwt() ->> 'role' IN ('admin', 'head')
      )
    )
  );