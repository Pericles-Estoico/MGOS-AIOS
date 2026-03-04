ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  email_deadline_approaching BOOLEAN DEFAULT true;