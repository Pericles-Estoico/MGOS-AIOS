CREATE POLICY "QA can view marketplace plans"
  ON public.marketplace_plans FOR SELECT
  USING (auth.jwt()->>'role' = 'qa');