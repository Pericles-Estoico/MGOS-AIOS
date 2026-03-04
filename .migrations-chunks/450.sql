CREATE POLICY "user_soft_delete_messages" ON public.agent_messages
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);