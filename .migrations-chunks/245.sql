INSERT INTO audit_logs (action, table_name, record_id, user_id, changes)
VALUES (
  'CREATE_TABLE',
  'reassignment_history',
  NULL,
  NULL,
  '{"table":"reassignment_history","columns":["id","task_id","old_assignee_id","new_assignee_id","reason","reassigned_by","created_at"]}'
)
ON CONFLICT DO NOTHING;