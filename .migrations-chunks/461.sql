CREATE TRIGGER agent_messages_updated_at_trigger
BEFORE UPDATE ON public.agent_messages
FOR EACH ROW
EXECUTE FUNCTION update_agent_messages_updated_at();