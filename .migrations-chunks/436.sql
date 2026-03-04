CREATE POLICY "Admin and head can view all job executions"
  ON marketplace_job_executions
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'head')
    OR auth.jwt() ->> 'role' = 'qa'
  );