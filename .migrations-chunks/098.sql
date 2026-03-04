CREATE TRIGGER audit_tasks_insert
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();