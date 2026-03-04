create trigger log_task_activity_trigger
  after update on tasks
  for each row
  execute function log_task_activity();