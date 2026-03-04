update tasks set search_vector =
  to_tsvector('portuguese', coalesce(title, '')) ||
  to_tsvector('portuguese', coalesce(description, ''))
where search_vector is null;