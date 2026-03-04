CREATE OR REPLACE FUNCTION user_can_create_tasks(user_role VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_role IN ('admin', 'ceo', 'head', 'lider');