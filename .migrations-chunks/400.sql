ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo';