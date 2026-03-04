CREATE POLICY IF NOT EXISTS marketplace_subtasks_all_service_role
  ON public.marketplace_subtasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);