CREATE TRIGGER update_email_tracking_updated_at
  BEFORE UPDATE ON email_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();