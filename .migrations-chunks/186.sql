create or replace function update_email_queue_timestamp()
returns trigger as $$
begin
  new.updated_at = now();