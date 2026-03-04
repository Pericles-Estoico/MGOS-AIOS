create trigger update_comment_timestamp_trigger
  before update on task_comments
  for each row
  execute function update_comment_timestamp();