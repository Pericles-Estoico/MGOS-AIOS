CREATE OR REPLACE FUNCTION calculate_duration_hours(
  status_created_at TIMESTAMP WITH TIME ZONE,
  status_completed_at TIMESTAMP WITH TIME ZONE
) RETURNS FLOAT AS $$
BEGIN
  IF status_completed_at IS NULL THEN
    RETURN NULL;