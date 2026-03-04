CREATE POLICY "user_view_own_messages" ON public.agent_messages
  FOR SELECT
  USING (auth.uid() = user_id);