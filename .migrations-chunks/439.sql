CREATE OR REPLACE FUNCTION update_marketplace_job_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();