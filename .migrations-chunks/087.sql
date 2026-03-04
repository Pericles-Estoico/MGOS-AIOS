CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  DECLARE
    action_type VARCHAR;