CREATE POLICY "Admin can create plans"
  ON public.marketplace_plans FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');