if (old.assigned_to != new.assigned_to) then
      insert into task_activity (task_id, user_id, action, details)
      values (
        new.id,
        auth.uid(),
        'reassigned',
        jsonb_build_object('old_assignee', old.assigned_to, 'new_assignee', new.assigned_to)
      );