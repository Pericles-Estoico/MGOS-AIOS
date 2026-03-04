create trigger update_email_queue_timestamp_trigger
  before update on email_queue
  for each row
  execute function update_email_queue_timestamp();