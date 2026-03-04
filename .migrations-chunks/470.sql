CREATE POLICY "admin_update_channels" ON public.marketplace_channels
  FOR UPDATE
  USING ((SELECT (auth.jwt() ->> 'role') IN ('admin', 'head')))
  WITH CHECK ((SELECT (auth.jwt() ->> 'role') IN ('admin', 'head')));