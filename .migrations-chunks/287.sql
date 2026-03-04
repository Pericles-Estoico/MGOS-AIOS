begin
  select
    count(*) filter (where status = 'approved'),
    count(*) filter (where status = 'in_progress')
  into completed, in_progress
  from tasks
  where assigned_to = user_id_param
  and sprint_id = sprint_id_param;