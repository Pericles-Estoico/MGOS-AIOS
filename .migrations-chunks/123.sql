/*
INSERT INTO public.users (id, email, role, name, avatar_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', 'admin', 'Admin User', NULL),
  ('550e8400-e29b-41d4-a716-446655440002', 'head@example.com', 'head', 'Head Marketing', NULL),
  ('550e8400-e29b-41d4-a716-446655440003', 'executor@example.com', 'executor', 'Executor One', NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'qa@example.com', 'qa', 'QA Reviewer', NULL)
ON CONFLICT (id) DO NOTHING;