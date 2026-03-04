*/


/*
INSERT INTO public.tasks (
  id, title, description, status, priority,
  assigned_to, created_by, due_date, due_time, frente
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655550001',
    'Create landing page mockup',
    'Design a mockup for the new landing page including hero, features, and CTA sections',
    'a_fazer',
    'high',
    '550e8400-e29b-41d4-a716-446655440003', -- assigned to executor
    '550e8400-e29b-41d4-a716-446655440002', -- created by head
    '2026-02-20',
    '17:00',
    'Conteúdo'
  ),
  (
    '550e8400-e29b-41d4-a716-446655550002',
    'Write product description for Marketplace',
    'Create compelling product description with benefits and features for new marketplace listing',
    'fazendo',
    'medium',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    '2026-02-19',
    '18:00',
    'Marketplace'
  ),
  (
    '550e8400-e29b-41d4-a716-446655550003',
    'Set up Google Ads campaign',
    'Configure new Google Ads campaign for Q1 promotion with budget allocation',
    'enviado_qa',
    'high',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    '2026-02-18',
    '15:00',
    'Ads'
  )
ON CONFLICT (id) DO NOTHING;