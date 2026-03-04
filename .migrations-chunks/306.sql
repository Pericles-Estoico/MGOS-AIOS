create or replace function update_tasks_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    to_tsvector('portuguese', coalesce(new.title, '')) ||
    to_tsvector('portuguese', coalesce(new.description, ''));