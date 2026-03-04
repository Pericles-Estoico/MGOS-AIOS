create or replace function update_comment_timestamp()
returns trigger as $$
begin
  new.updated_at = now();