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