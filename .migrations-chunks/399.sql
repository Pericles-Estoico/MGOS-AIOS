ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  quiet_hours_end TIME DEFAULT '08:00';