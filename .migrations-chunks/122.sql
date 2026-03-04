CREATE TRIGGER update_tasks_timestamp
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();