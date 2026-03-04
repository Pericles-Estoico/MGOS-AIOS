CREATE POLICY "Admins see all audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');