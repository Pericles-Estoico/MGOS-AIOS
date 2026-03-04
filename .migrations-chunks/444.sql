CREATE TRIGGER trigger_update_marketplace_job_executions_updated_at
  BEFORE UPDATE ON marketplace_job_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_job_executions_updated_at();