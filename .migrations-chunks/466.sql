CREATE TRIGGER agent_messages_archive_trigger
AFTER DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION archive_agent_messages_on_user_delete();