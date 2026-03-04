CREATE TRIGGER marketplace_tasks_updated_at
  BEFORE UPDATE ON public.marketplace_tasks
  FOR EACH ROW EXECUTE FUNCTION update_marketplace_tasks_updated_at();