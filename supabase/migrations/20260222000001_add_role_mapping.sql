-- Update roles to match business model
-- Date: 2026-02-22
-- Purpose: Add CEO/Lider roles that map to Admin/Head roles for task creation permissions

-- Alter users table constraint to allow new roles
ALTER TABLE public.users DROP CONSTRAINT users_role_check;

ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'head', 'executor', 'qa', 'ceo', 'lider'));

-- Add comment explaining role mapping
COMMENT ON COLUMN public.users.role IS 'User role: admin/ceo (full access), head/lider (create/assign tasks), executor (execute tasks), qa (review evidence)';

-- Create a function to check if user can create tasks
CREATE OR REPLACE FUNCTION user_can_create_tasks(user_role VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_role IN ('admin', 'ceo', 'head', 'lider');
END;
$$ LANGUAGE plpgsql;
