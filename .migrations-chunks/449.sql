CREATE POLICY "user_insert_messages" ON public.agent_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);