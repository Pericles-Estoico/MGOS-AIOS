CREATE POLICY "Insert own time logs"
  ON public.time_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());