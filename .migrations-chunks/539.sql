CREATE INDEX IF NOT EXISTS idx_audit_logs_status_user_created
ON audit_logs(status, user_id, created_at DESC);