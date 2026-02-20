-- Analytics Schema & Optimization
-- Story 3.6: Analytics Data Aggregation Phase 2
-- Indexes for query optimization + RPC functions for metric calculations

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Index on audit_logs for efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs(created_at DESC);

-- Index on task_id for joining with tasks
CREATE INDEX IF NOT EXISTS idx_audit_logs_task_id
ON audit_logs(task_id);

-- Index on user_id for per-user aggregations
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
ON audit_logs(user_id);

-- Composite index for most common queries (status by date by user)
CREATE INDEX IF NOT EXISTS idx_audit_logs_status_user_created
ON audit_logs(status, user_id, created_at DESC);

-- ============================================================================
-- Helper Function: Calculate Duration in Hours
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_duration_hours(
  status_created_at TIMESTAMP WITH TIME ZONE,
  status_completed_at TIMESTAMP WITH TIME ZONE
) RETURNS FLOAT AS $$
BEGIN
  IF status_completed_at IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(EPOCH FROM (status_completed_at - status_created_at)) / 3600.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- RPC Function: Calculate Per-User Metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_per_user_metrics(
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE,
  user_id_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  display_name VARCHAR,
  task_count BIGINT,
  avg_completion_time NUMERIC,
  total_hours NUMERIC,
  approval_rate NUMERIC,
  rejection_rate NUMERIC,
  last_completed TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH user_tasks AS (
    -- Get all status transitions for each user in date range
    SELECT
      al.user_id,
      up.display_name,
      al.task_id,
      al.status,
      al.created_at,
      al.updated_at,
      LAG(al.status) OVER (PARTITION BY al.task_id ORDER BY al.created_at) as prev_status,
      LAG(al.created_at) OVER (PARTITION BY al.task_id ORDER BY al.created_at) as prev_created_at
    FROM audit_logs al
    LEFT JOIN user_profiles up ON al.user_id = up.user_id
    WHERE al.created_at >= date_start
      AND al.created_at <= date_end
      AND (user_id_filter IS NULL OR al.user_id = user_id_filter)
  ),
  completed_tasks AS (
    -- Filter to only approved/rejected tasks (completed)
    SELECT
      user_id,
      display_name,
      task_id,
      status,
      created_at,
      updated_at,
      prev_created_at,
      calculate_duration_hours(prev_created_at, created_at) as duration_hours
    FROM user_tasks
    WHERE status IN ('approved', 'rejected')
      AND prev_status = 'submitted'
  ),
  aggregated AS (
    SELECT
      user_id,
      display_name,
      COUNT(DISTINCT task_id) as task_count,
      AVG(COALESCE(duration_hours, 0)) as avg_completion_time,
      SUM(COALESCE(duration_hours, 0)) as total_hours,
      ROUND(
        100.0 * COUNT(CASE WHEN status = 'approved' THEN 1 END) /
        NULLIF(COUNT(DISTINCT task_id), 0),
        2
      ) as approval_rate,
      ROUND(
        100.0 * COUNT(CASE WHEN status = 'rejected' THEN 1 END) /
        NULLIF(COUNT(DISTINCT task_id), 0),
        2
      ) as rejection_rate,
      MAX(created_at) as last_completed
    FROM completed_tasks
    GROUP BY user_id, display_name
  )
  SELECT
    user_id,
    display_name,
    task_count,
    ROUND(avg_completion_time::NUMERIC, 2),
    ROUND(total_hours::NUMERIC, 2),
    COALESCE(approval_rate, 0),
    COALESCE(rejection_rate, 0),
    last_completed
  FROM aggregated
  ORDER BY task_count DESC, user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC Function: Calculate Team Metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_team_metrics(
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  total_tasks BIGINT,
  avg_daily_completion NUMERIC,
  burndown_trend JSONB,
  team_avg_time NUMERIC,
  overall_success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_completions AS (
    -- Count completed tasks per day
    SELECT
      DATE(al.created_at) as completion_date,
      COUNT(DISTINCT al.task_id) as tasks_completed
    FROM audit_logs al
    WHERE al.created_at >= date_start
      AND al.created_at <= date_end
      AND al.status IN ('approved', 'rejected')
      AND LAG(al.status) OVER (PARTITION BY al.task_id ORDER BY al.created_at) = 'submitted'
    GROUP BY DATE(al.created_at)
  ),
  burndown_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', TO_CHAR(completion_date, 'YYYY-MM-DD'),
        'tasks_completed', tasks_completed
      ) ORDER BY completion_date
    ) as trend
    FROM daily_completions
  ),
  task_durations AS (
    -- Calculate duration for all completed tasks
    SELECT
      al.task_id,
      calculate_duration_hours(
        MIN(CASE WHEN al.status = 'created' THEN al.created_at END),
        MAX(CASE WHEN al.status IN ('approved', 'rejected') THEN al.created_at END)
      ) as duration_hours,
      MAX(CASE WHEN al.status IN ('approved', 'rejected') THEN al.status END) as final_status
    FROM audit_logs al
    WHERE al.created_at >= date_start
      AND al.created_at <= date_end
    GROUP BY al.task_id
  ),
  team_stats AS (
    SELECT
      COUNT(DISTINCT task_id) as total_completed,
      AVG(COALESCE(duration_hours, 0)) as avg_duration,
      ROUND(
        100.0 * COUNT(CASE WHEN final_status = 'approved' THEN 1 END) /
        NULLIF(COUNT(DISTINCT task_id), 0),
        2
      ) as success_rate
    FROM task_durations
  )
  SELECT
    ts.total_completed,
    ROUND((ts.total_completed::NUMERIC /
      NULLIF(EXTRACT(DAY FROM date_end - date_start)::NUMERIC, 0)), 2),
    COALESCE(bd.trend, '[]'::jsonb),
    ROUND(ts.avg_duration::NUMERIC, 2),
    COALESCE(ts.success_rate, 0)
  FROM team_stats ts, burndown_data bd;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC Function: Calculate QA Metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_qa_metrics(
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  avg_review_time NUMERIC,
  pending_reviews BIGINT,
  review_sla NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH review_times AS (
    -- Get time from submitted → approved/rejected (QA review time)
    SELECT
      al.task_id,
      calculate_duration_hours(
        submitted_time.created_at,
        MAX(al.created_at)
      ) as review_duration_hours,
      CASE
        WHEN calculate_duration_hours(submitted_time.created_at, MAX(al.created_at)) <= 24
        THEN 1
        ELSE 0
      END as meets_sla
    FROM audit_logs al
    JOIN (
      SELECT task_id, created_at
      FROM audit_logs
      WHERE status = 'submitted'
    ) submitted_time ON al.task_id = submitted_time.task_id
    WHERE al.created_at >= date_start
      AND al.created_at <= date_end
      AND al.status IN ('approved', 'rejected')
      AND al.created_at > submitted_time.created_at
    GROUP BY al.task_id, submitted_time.created_at
  ),
  pending_tasks AS (
    -- Count tasks still in submitted status (pending review)
    SELECT COUNT(DISTINCT task_id) as pending_count
    FROM audit_logs
    WHERE created_at >= date_start
      AND created_at <= date_end
      AND status = 'submitted'
      AND NOT EXISTS (
        SELECT 1 FROM audit_logs al2
        WHERE al2.task_id = audit_logs.task_id
          AND al2.status IN ('approved', 'rejected')
          AND al2.created_at > audit_logs.created_at
      )
  ),
  qa_stats AS (
    SELECT
      AVG(review_duration_hours) as avg_duration,
      ROUND(
        100.0 * SUM(meets_sla) / NULLIF(COUNT(*), 0),
        2
      ) as sla_percentage
    FROM review_times
  )
  SELECT
    ROUND(COALESCE(qa_stats.avg_duration, 0)::NUMERIC, 2),
    COALESCE(pt.pending_count, 0),
    COALESCE(qa_stats.sla_percentage, 0)
  FROM qa_stats, pending_tasks pt;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grant Permissions for RLS Security
-- ============================================================================

-- Allow authenticated users to call RPC functions (with row-level filtering in service layer)
GRANT EXECUTE ON FUNCTION calculate_per_user_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_team_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_qa_metrics TO authenticated;
