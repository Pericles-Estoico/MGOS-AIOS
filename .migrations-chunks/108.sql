CREATE TRIGGER audit_qa_reviews_insert
  AFTER INSERT ON public.qa_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();