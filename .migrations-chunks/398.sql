ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  quiet_hours_start TIME DEFAULT '22:00';