CREATE OR REPLACE FUNCTION archive_agent_messages_on_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.agent_messages
  SET user_deleted_at = NOW()
  WHERE user_id = OLD.id AND user_deleted_at IS NULL;