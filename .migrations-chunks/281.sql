begin
  select
    count(*),
    count(*) filter (where status = 'approved'),
    count(*) filter (where status = 'in_progress'),
    count(*) filter (where status = 'blocked')
  into total, completed, in_progress, blocked
  from tasks
  where sprint_id = sprint_id_param;