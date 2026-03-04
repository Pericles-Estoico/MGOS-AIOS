CREATE TRIGGER audit_tasks_delete
  AFTER DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();