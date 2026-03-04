create trigger update_tasks_search_vector_trigger
  before insert or update on tasks
  for each row
  execute function update_tasks_search_vector();