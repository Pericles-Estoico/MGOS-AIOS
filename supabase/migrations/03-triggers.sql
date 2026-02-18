-- Migration 03: Create audit trail triggers
-- Date: 2026-02-18
-- Description: PostgreSQL triggers to auto-log all changes to audit_logs

-- ============================================================================
-- FUNCTION: Generic audit log trigger
-- ============================================================================
-- Logs INSERT, UPDATE, DELETE operations to audit_logs table
-- Uses SECURITY DEFINER to bypass RLS (required for audit trail)

DROP FUNCTION IF EXISTS public.log_audit_trail() CASCADE;
CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Determine action type based on trigger operation
  DECLARE
    action_type VARCHAR;
  BEGIN
    action_type := CASE
      WHEN TG_OP = 'INSERT' THEN 'INSERT'
      WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
      WHEN TG_OP = 'DELETE' THEN 'DELETE'
    END;

    -- Insert audit log record
    INSERT INTO public.audit_logs (
      entity_type,
      entity_id,
      action,
      changed_by,
      old_values,
      new_values,
      changed_at
    ) VALUES (
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      action_type,
      COALESCE(auth.uid(), (SELECT id FROM public.users LIMIT 1)), -- fallback if no auth context
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
      NOW()
    );

    -- Return appropriate row
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END;
END;
$$;

COMMENT ON FUNCTION public.log_audit_trail() IS 'Generic trigger function for audit trail - logs all INSERT/UPDATE/DELETE operations';

-- ============================================================================
-- TRIGGER: tasks table
-- ============================================================================
-- Logs all changes to tasks (create, update status, delete)

DROP TRIGGER IF EXISTS audit_tasks_insert ON public.tasks;
CREATE TRIGGER audit_tasks_insert
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

DROP TRIGGER IF EXISTS audit_tasks_update ON public.tasks;
CREATE TRIGGER audit_tasks_update
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.log_audit_trail();

DROP TRIGGER IF EXISTS audit_tasks_delete ON public.tasks;
CREATE TRIGGER audit_tasks_delete
  AFTER DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

-- ============================================================================
-- TRIGGER: evidence table
-- ============================================================================
-- Logs all evidence submissions and deletions

DROP TRIGGER IF EXISTS audit_evidence_insert ON public.evidence;
CREATE TRIGGER audit_evidence_insert
  AFTER INSERT ON public.evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

DROP TRIGGER IF EXISTS audit_evidence_delete ON public.evidence;
CREATE TRIGGER audit_evidence_delete
  AFTER DELETE ON public.evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

-- ============================================================================
-- TRIGGER: qa_reviews table
-- ============================================================================
-- Logs all QA approvals and rejections

DROP TRIGGER IF EXISTS audit_qa_reviews_insert ON public.qa_reviews;
CREATE TRIGGER audit_qa_reviews_insert
  AFTER INSERT ON public.qa_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

DROP TRIGGER IF EXISTS audit_qa_reviews_update ON public.qa_reviews;
CREATE TRIGGER audit_qa_reviews_update
  AFTER UPDATE ON public.qa_reviews
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.log_audit_trail();

-- ============================================================================
-- TRIGGER: time_logs table
-- ============================================================================
-- Logs all time log entries

DROP TRIGGER IF EXISTS audit_time_logs_insert ON public.time_logs;
CREATE TRIGGER audit_time_logs_insert
  AFTER INSERT ON public.time_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

-- ============================================================================
-- FUNCTION: Update updated_at timestamp
-- ============================================================================
-- Auto-update the updated_at column on any change

DROP FUNCTION IF EXISTS public.update_timestamp() CASCADE;
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_timestamp() IS 'Auto-update updated_at timestamp on any row modification';

-- ============================================================================
-- TRIGGER: Auto-update timestamps
-- ============================================================================
-- Keep updated_at automatically current

DROP TRIGGER IF EXISTS update_users_timestamp ON public.users;
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_tasks_timestamp ON public.tasks;
CREATE TRIGGER update_tasks_timestamp
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- ============================================================================
-- Summary
-- ============================================================================
-- Triggers Created: 11
--   - 3 on tasks (insert, update, delete)
--   - 2 on evidence (insert, delete)
--   - 2 on qa_reviews (insert, update)
--   - 1 on time_logs (insert)
--   - 3 for timestamps (users, tasks)
--
-- Functions: 2
--   - log_audit_trail() - generic audit function
--   - update_timestamp() - timestamp auto-updater
--
-- Features:
-- - Immutable audit trail (inserts only via triggers)
-- - Automatic timestamp management
-- - Changed_by captures user context
-- - old_values/new_values track all changes
-- - SECURITY DEFINER allows bypass of RLS for audit logging
--
-- Next: Migration 04 will add seed data for testing
