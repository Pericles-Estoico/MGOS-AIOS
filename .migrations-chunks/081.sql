CREATE POLICY "See own time logs"
  ON public.time_logs FOR SELECT
  USING (user_id = auth.uid());