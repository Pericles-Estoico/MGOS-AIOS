create or replace function log_task_activity()
returns trigger as $$
begin
  if (TG_OP = 'UPDATE') then
    if (old.status != new.status) then
      insert into task_activity (task_id, user_id, action, details)
      values (
        new.id,
        auth.uid(),
        'status_changed',
        jsonb_build_object('old_status', old.status, 'new_status', new.status)
      );