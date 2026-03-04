CREATE TRIGGER audit_tasks_update
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.log_audit_trail();