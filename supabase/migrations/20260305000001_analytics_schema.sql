-- Analytics Schema & Optimization
-- Story 3.6: Analytics Data Aggregation Phase 2
-- Indexes for query optimization + RPC functions for metric calculations
-- Fixed 2026-03-05: align column names with actual audit_logs schema
--   audit_logs real columns: id, entity_type, entity_id, action, changed_by, old_values, new_values, changed_at

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at
  ON public.audit_logs(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id
  ON public.audit_logs(entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by
  ON public.audit_logs(changed_by);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_changed_at
  ON public.audit_logs(entity_type, changed_at DESC);

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
    SELECT
      al.changed_by                                                    AS user_id,
      u.name                                                           AS display_name,
      al.entity_id                                                     AS task_id,
      (al.new_values->>'status')                                       AS new_status,
      (al.old_values->>'status')                                       AS prev_status,
      al.changed_at
    FROM public.audit_logs al
    LEFT JOIN public.users u ON al.changed_by = u.id
    WHERE al.entity_type = 'task'
      AND al.changed_at >= date_start
      AND al.changed_at <= date_end
      AND (user_id_filter IS NULL OR al.changed_by = user_id_filter)
  ),
  completed_tasks AS (
    SELECT
      cur.user_id,
      cur.display_name,
      cur.task_id,
      cur.new_status                                                    AS final_status,
      prev.changed_at                                                   AS prev_time,
      cur.changed_at,
      calculate_duration_hours(prev.changed_at, cur.changed_at)        AS duration_hours
    FROM user_tasks cur
    LEFT JOIN (
      SELECT entity_id, changed_at
      FROM public.audit_logs
      WHERE entity_type = 'task'
        AND (new_values->>'status') = 'enviado_qa'
    ) prev ON prev.entity_id = cur.task_id
    WHERE cur.new_status IN ('aprovado', 'concluido')
  ),
  aggregated AS (
    SELECT
      user_id,
      display_name,
      COUNT(DISTINCT task_id)                                           AS task_count,
      AVG(COALESCE(duration_hours, 0))                                  AS avg_completion_time,
      SUM(COALESCE(duration_hours, 0))                                  AS total_hours,
      ROUND(
        100.0 * COUNT(CASE WHEN final_status = 'aprovado' THEN 1 END) /
        NULLIF(COUNT(DISTINCT task_id), 0), 2
      )                                                                 AS approval_rate,
      ROUND(
        100.0 * COUNT(CASE WHEN final_status != 'aprovado' THEN 1 END) /
        NULLIF(COUNT(DISTINCT task_id), 0), 2
      )                                                                 AS rejection_rate,
      MAX(changed_at)                                                   AS last_completed
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
    SELECT
      DATE(al.changed_at)                          AS completion_date,
      COUNT(DISTINCT al.entity_id)                 AS tasks_completed
    FROM public.audit_logs al
    WHERE al.entity_type = 'task'
      AND al.changed_at >= date_start
      AND al.changed_at <= date_end
      AND (al.new_values->>'status') IN ('aprovado', 'concluido')
    GROUP BY DATE(al.changed_at)
  ),
  burndown_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', TO_CHAR(completion_date, 'YYYY-MM-DD'),
        'tasks_completed', tasks_completed
      ) ORDER BY completion_date
    ) AS trend
    FROM daily_completions
  ),
  task_durations AS (
    SELECT
      al.entity_id                                 AS task_id,
      calculate_duration_hours(
        MIN(al.changed_at),
        MAX(CASE WHEN (al.new_values->>'status') IN ('aprovado','concluido') THEN al.changed_at END)
      )                                            AS duration_hours,
      MAX(al.new_values->>'status')                AS final_status
    FROM public.audit_logs al
    WHERE al.entity_type = 'task'
      AND al.changed_at >= date_start
      AND al.changed_at <= date_end
    GROUP BY al.entity_id
  ),
  team_stats AS (
    SELECT
      COUNT(DISTINCT task_id)                      AS total_completed,
      AVG(COALESCE(duration_hours, 0))             AS avg_duration,
      ROUND(
        100.0 * COUNT(CASE WHEN final_status = 'aprovado' THEN 1 END) /
        NULLIF(COUNT(DISTINCT task_id), 0), 2
      )                                            AS success_rate
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
  WITH submitted_times AS (
    SELECT entity_id AS task_id, changed_at AS submitted_at
    FROM public.audit_logs
    WHERE entity_type = 'task'
      AND (new_values->>'status') = 'enviado_qa'
  ),
  review_times AS (
    SELECT
      al.entity_id                                 AS task_id,
      calculate_duration_hours(
        st.submitted_at,
        al.changed_at
      )                                            AS review_duration_hours,
      CASE
        WHEN calculate_duration_hours(st.submitted_at, al.changed_at) <= 24 THEN 1
        ELSE 0
      END                                          AS meets_sla
    FROM public.audit_logs al
    JOIN submitted_times st ON al.entity_id = st.task_id
    WHERE al.entity_type = 'task'
      AND al.changed_at >= date_start
      AND al.changed_at <= date_end
      AND (al.new_values->>'status') IN ('aprovado', 'concluido')
      AND al.changed_at > st.submitted_at
  ),
  pending_tasks AS (
    SELECT COUNT(DISTINCT s.task_id) AS pending_count
    FROM submitted_times s
    WHERE s.submitted_at >= date_start
      AND s.submitted_at <= date_end
      AND NOT EXISTS (
        SELECT 1 FROM public.audit_logs al2
        WHERE al2.entity_id = s.task_id
          AND al2.entity_type = 'task'
          AND (al2.new_values->>'status') IN ('aprovado', 'concluido')
          AND al2.changed_at > s.submitted_at
      )
  ),
  qa_stats AS (
    SELECT
      AVG(review_duration_hours)                   AS avg_duration,
      ROUND(100.0 * SUM(meets_sla) / NULLIF(COUNT(*), 0), 2) AS sla_percentage
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
-- Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION calculate_duration_hours TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_per_user_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_team_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_qa_metrics TO authenticated;
