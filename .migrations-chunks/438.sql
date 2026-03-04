CREATE POLICY "Admin and head can update job executions"
  ON marketplace_job_executions
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'head')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'head')
  );