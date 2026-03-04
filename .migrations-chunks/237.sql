CREATE TABLE IF NOT EXISTS reassignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  old_assignee_id UUID NOT NULL REFERENCES users(id),
  new_assignee_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  reassigned_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);