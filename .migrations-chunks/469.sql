CREATE POLICY "admin_view_all_channels" ON public.marketplace_channels
  FOR SELECT
  USING ((SELECT (auth.jwt() ->> 'role') IN ('admin', 'head')));