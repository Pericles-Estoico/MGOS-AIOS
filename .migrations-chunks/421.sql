CREATE POLICY "Admin sees all marketplace plans"
  ON public.marketplace_plans FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');