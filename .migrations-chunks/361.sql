CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  task_assigned BOOLEAN DEFAULT true,
  status_changed BOOLEAN DEFAULT true,
  comment_mention BOOLEAN DEFAULT true,
  deadline_approaching BOOLEAN DEFAULT true,
  daily_digest BOOLEAN DEFAULT false,
  quiet_hours_start VARCHAR(5), -- HH:MM format
  quiet_hours_end VARCHAR(5),   -- HH:MM format
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);