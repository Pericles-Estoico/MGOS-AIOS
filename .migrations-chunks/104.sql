CREATE TRIGGER audit_evidence_insert
  AFTER INSERT ON public.evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();