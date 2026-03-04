CREATE OR REPLACE FUNCTION update_agent_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();