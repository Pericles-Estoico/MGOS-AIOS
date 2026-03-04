CREATE OR REPLACE FUNCTION update_marketplace_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();