create or replace function capture_user_metrics(user_id_param uuid, sprint_id_param uuid)
returns void as $$
declare
  completed integer;