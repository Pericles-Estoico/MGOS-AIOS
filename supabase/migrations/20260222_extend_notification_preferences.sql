-- Extend notification_preferences table with additional fields
-- Added: 2026-02-22

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  email_status_changed BOOLEAN DEFAULT true;

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  email_comment_mention BOOLEAN DEFAULT true;

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  email_deadline_approaching BOOLEAN DEFAULT true;

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  email_daily_digest BOOLEAN DEFAULT false;

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  quiet_hours_start TIME DEFAULT '22:00';

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  quiet_hours_end TIME DEFAULT '08:00';

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo';

-- Update comments
COMMENT ON COLUMN notification_preferences.email_status_changed IS 'Send email when task status changes';
COMMENT ON COLUMN notification_preferences.email_comment_mention IS 'Send email when mentioned in comments';
COMMENT ON COLUMN notification_preferences.email_deadline_approaching IS 'Send email when task deadline is approaching';
COMMENT ON COLUMN notification_preferences.email_daily_digest IS 'Send daily digest of tasks and updates';
COMMENT ON COLUMN notification_preferences.quiet_hours_start IS 'Start time for quiet hours (HH:MM format)';
COMMENT ON COLUMN notification_preferences.quiet_hours_end IS 'End time for quiet hours (HH:MM format)';
COMMENT ON COLUMN notification_preferences.timezone IS 'User timezone for scheduling notifications';
