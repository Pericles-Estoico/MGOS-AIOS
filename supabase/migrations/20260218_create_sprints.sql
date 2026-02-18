-- Create sprints table
CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  goals TEXT,
  status VARCHAR(50) DEFAULT 'planning', -- planning, active, completed
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);
CREATE INDEX IF NOT EXISTS idx_sprints_created_at ON sprints(created_at DESC);

-- Enable RLS
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin can see all sprints
CREATE POLICY "admins_can_view_sprints" ON sprints
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'head');

-- Admin can create sprints
CREATE POLICY "admins_can_create_sprints" ON sprints
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admin can update sprints
CREATE POLICY "admins_can_update_sprints" ON sprints
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admin can delete sprints
CREATE POLICY "admins_can_delete_sprints" ON sprints
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Add sprint_id to tasks table if not exists
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;

-- Create index on sprint_id
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON tasks(sprint_id);

-- Create audit log entry
INSERT INTO audit_logs (action, table_name, record_id, user_id, changes)
VALUES (
  'CREATE_TABLE',
  'sprints',
  NULL,
  NULL,
  '{"table":"sprints","columns":["id","name","goals","status","start_date","end_date","created_by","created_at","updated_at"]}'
)
ON CONFLICT DO NOTHING;
