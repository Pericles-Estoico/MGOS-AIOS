create or replace function capture_team_metrics(sprint_id_param uuid)
returns void as $$
declare
  total integer;