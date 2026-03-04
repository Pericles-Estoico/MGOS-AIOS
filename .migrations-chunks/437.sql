CREATE POLICY "Admin and head can insert job executions"
  ON marketplace_job_executions
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'head')
  );