CREATE POLICY "marketplace_tasks_update" ON public.marketplace_tasks
  FOR UPDATE USING (auth.uid() IS NOT NULL);