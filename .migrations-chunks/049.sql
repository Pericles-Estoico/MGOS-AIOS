CREATE POLICY "Executors see assigned"
  ON public.tasks FOR SELECT
  USING (assigned_to = auth.uid());