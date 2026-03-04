ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  email_daily_digest BOOLEAN DEFAULT false;