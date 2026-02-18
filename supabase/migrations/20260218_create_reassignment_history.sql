-- Create reassignment_history table
CREATE TABLE IF NOT EXISTS reassignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  old_assignee_id UUID NOT NULL REFERENCES users(id),
  new_assignee_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  reassigned_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reassignment_history_task_id ON reassignment_history(task_id);
CREATE INDEX IF NOT EXISTS idx_reassignment_history_old_assignee ON reassignment_history(old_assignee_id);
CREATE INDEX IF NOT EXISTS idx_reassignment_history_new_assignee ON reassignment_history(new_assignee_id);
CREATE INDEX IF NOT EXISTS idx_reassignment_history_created_at ON reassignment_history(created_at DESC);

-- Enable RLS
ALTER TABLE reassignment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view reassignment history for their own tasks or tasks they can see
CREATE POLICY "users_can_view_reassignment_history" ON reassignment_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = reassignment_history.task_id
      AND (
        t.assigned_to = auth.uid()
        OR auth.jwt() ->> 'role' IN ('admin', 'head')
      )
    )
  );

-- Only admin/head can create reassignment history
CREATE POLICY "admins_can_create_reassignment_history" ON reassignment_history
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'head'));

-- Audit log entry
INSERT INTO audit_logs (action, table_name, record_id, user_id, changes)
VALUES (
  'CREATE_TABLE',
  'reassignment_history',
  NULL,
  NULL,
  '{"table":"reassignment_history","columns":["id","task_id","old_assignee_id","new_assignee_id","reason","reassigned_by","created_at"]}'
)
ON CONFLICT DO NOTHING;
