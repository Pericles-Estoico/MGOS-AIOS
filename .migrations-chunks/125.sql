*/


/*
INSERT INTO public.evidence (
  id, task_id, submitted_by, evidence_type, file_url, link_url, comment
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655660001',
    '550e8400-e29b-41d4-a716-446655550003',
    '550e8400-e29b-41d4-a716-446655440003',
    'link',
    NULL,
    'https://ads.google.com/campaign/12345',
    'Campaign is live with $500 daily budget'
  )
ON CONFLICT (id) DO NOTHING;