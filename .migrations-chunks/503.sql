CREATE POLICY "marketplace_tasks_select" ON public.marketplace_tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);