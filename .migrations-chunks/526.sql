CREATE POLICY IF NOT EXISTS marketplace_subtasks_read_authenticated
  ON public.marketplace_subtasks
  FOR SELECT
  TO authenticated
  USING (true);