CREATE TRIGGER marketplace_subtasks_update_timestamp
  BEFORE UPDATE ON public.marketplace_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketplace_subtasks_updated_at();