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