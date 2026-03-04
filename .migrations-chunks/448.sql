CREATE POLICY "admin_view_all_messages" ON public.agent_messages
  FOR SELECT
  USING ((SELECT (auth.jwt() ->> 'role') IN ('admin', 'head')));