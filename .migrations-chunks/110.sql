CREATE TRIGGER audit_qa_reviews_update
  AFTER UPDATE ON public.qa_reviews
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.log_audit_trail();