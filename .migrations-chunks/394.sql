ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  email_status_changed BOOLEAN DEFAULT true;