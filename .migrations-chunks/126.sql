*/


/*
INSERT INTO public.qa_reviews (
  id, task_id, reviewed_by, status, reason
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655770001',
    '550e8400-e29b-41d4-a716-446655550003',
    '550e8400-e29b-41d4-a716-446655440004',
    'aprovado',
    'Campaign configured correctly with proper budget limits and targeting'
  )
ON CONFLICT (id) DO NOTHING;