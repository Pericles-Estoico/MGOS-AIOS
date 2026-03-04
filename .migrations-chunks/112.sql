CREATE TRIGGER audit_time_logs_insert
  AFTER INSERT ON public.time_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();