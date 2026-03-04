CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();