CREATE TRIGGER audit_evidence_delete
  AFTER DELETE ON public.evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();