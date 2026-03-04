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