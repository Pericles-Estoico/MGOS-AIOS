CREATE POLICY "user_view_active_channels" ON public.marketplace_channels
  FOR SELECT
  USING (status = 'active');