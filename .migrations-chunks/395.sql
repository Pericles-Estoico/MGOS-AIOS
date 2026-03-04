ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  email_comment_mention BOOLEAN DEFAULT true;