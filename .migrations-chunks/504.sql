CREATE POLICY "marketplace_tasks_insert" ON public.marketplace_tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);