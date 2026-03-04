INSERT INTO public.marketplace_channels (
  channel_key,
  name,
  marketplace_type,
  agent_name,
  status,
  approval_rate,
  completion_rate,
  avg_completion_time_minutes
) VALUES
  ('amazon', 'Amazon', 'marketplace', 'Alex (Amazon)', 'active', 87.5, 92.1, 180),
  ('mercadolivre', 'MercadoLivre', 'marketplace', 'Marina (MercadoLivre)', 'active', 91.2, 88.7, 210),
  ('shopee', 'Shopee', 'marketplace', 'Sunny (Shopee)', 'active', 85.3, 90.2, 195),
  ('shein', 'Shein', 'marketplace', 'Tren (Shein)', 'active', 88.9, 89.5, 175),
  ('tiktok', 'TikTok Shop', 'marketplace', 'Viral (TikTok Shop)', 'active', 93.1, 94.3, 150),
  ('kaway', 'Kaway', 'marketplace', 'Premium (Kaway)', 'active', 86.7, 91.8, 200)
ON CONFLICT (channel_key) DO NOTHING;