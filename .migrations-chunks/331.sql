INSERT INTO audit_logs (action, table_name, record_id, user_id, changes)
VALUES (
  'CREATE_TABLE',
  'sprints',
  NULL,
  NULL,
  '{"table":"sprints","columns":["id","name","goals","status","start_date","end_date","created_by","created_at","updated_at"]}'
)
ON CONFLICT DO NOTHING;