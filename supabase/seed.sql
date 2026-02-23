-- ============================================================================
-- SEED DATA: MGOS-AIOS Development & Testing
-- ============================================================================
-- Executar: npx supabase db push (já executa seed.sql)
-- Data de criação: 2026-02-23
-- Status: Production seed data

-- ============================================================================
-- 1. USERS (Setup users de teste para cada role)
-- ============================================================================

-- Admin user
INSERT INTO public.users (id, email, role, name, avatar_url, department, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'admin@empresa.com',
  'admin',
  'Admin User',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  'Management',
  true
) ON CONFLICT (id) DO NOTHING;

-- Head users (2)
INSERT INTO public.users (id, email, role, name, avatar_url, department, is_active)
VALUES
(
  '20000000-0000-0000-0000-000000000001'::uuid,
  'maria@empresa.com',
  'head',
  'Maria Silva',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
  'Operations',
  true
),
(
  '20000000-0000-0000-0000-000000000002'::uuid,
  'carlos@empresa.com',
  'head',
  'Carlos Santos',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
  'Marketplace',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Executor users (5)
INSERT INTO public.users (id, email, role, name, avatar_url, department, is_active)
VALUES
(
  '30000000-0000-0000-0000-000000000001'::uuid,
  'joao@empresa.com',
  'executor',
  'João Oliveira',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=joao',
  'Executors',
  true
),
(
  '30000000-0000-0000-0000-000000000002'::uuid,
  'ana@empresa.com',
  'executor',
  'Ana Costa',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=ana',
  'Executors',
  true
),
(
  '30000000-0000-0000-0000-000000000003'::uuid,
  'pedro@empresa.com',
  'executor',
  'Pedro Gomes',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=pedro',
  'Executors',
  true
),
(
  '30000000-0000-0000-0000-000000000004'::uuid,
  'lucia@empresa.com',
  'executor',
  'Lúcia Ferreira',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=lucia',
  'Executors',
  true
),
(
  '30000000-0000-0000-0000-000000000005'::uuid,
  'rafael@empresa.com',
  'executor',
  'Rafael Lima',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=rafael',
  'Executors',
  true
)
ON CONFLICT (id) DO NOTHING;

-- QA users (2)
INSERT INTO public.users (id, email, role, name, avatar_url, department, is_active)
VALUES
(
  '40000000-0000-0000-0000-000000000001'::uuid,
  'qa.paulo@empresa.com',
  'qa',
  'Paulo QA',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=paulo',
  'Quality',
  true
),
(
  '40000000-0000-0000-0000-000000000002'::uuid,
  'qa.isabella@empresa.com',
  'qa',
  'Isabella QA',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=isabella',
  'Quality',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. MARKETPLACE_CHANNELS (Seed data dos 6 canais)
-- ============================================================================

INSERT INTO public.marketplace_channels (
  channel_key, name, marketplace_type, agent_name, status,
  tasks_generated, tasks_approved, tasks_completed, tasks_rejected,
  approval_rate, completion_rate, avg_completion_time_minutes,
  revenue_7days, opportunities_count, total_items, conversion_rate
)
VALUES
(
  'amazon', 'Amazon', 'marketplace', 'Alex (Amazon)', 'active',
  245, 198, 182, 16,
  87.5, 92.1, 180,
  45000.50, 12, 3456, 3.2
),
(
  'mercadolivre', 'MercadoLivre', 'marketplace', 'Marina (MercadoLivre)', 'active',
  210, 182, 165, 17,
  91.2, 88.7, 210,
  38500.75, 8, 2890, 2.8
),
(
  'shopee', 'Shopee', 'marketplace', 'Sunny (Shopee)', 'active',
  198, 175, 158, 17,
  85.3, 90.2, 195,
  35200.00, 15, 5432, 2.5
),
(
  'shein', 'Shein', 'marketplace', 'Tren (Shein)', 'active',
  156, 134, 125, 9,
  88.9, 89.5, 175,
  28900.25, 6, 2145, 2.1
),
(
  'tiktok', 'TikTok Shop', 'marketplace', 'Viral (TikTok Shop)', 'active',
  189, 172, 161, 11,
  93.1, 94.3, 150,
  52100.00, 10, 1834, 3.8
),
(
  'kaway', 'Kaway', 'marketplace', 'Premium (Kaway)', 'active',
  145, 124, 114, 10,
  86.7, 91.8, 200,
  22300.50, 5, 1567, 1.9
)
ON CONFLICT (channel_key) DO NOTHING;

-- ============================================================================
-- 3. TASKS (Exemplos de tarefas em diferentes status)
-- ============================================================================

-- Task 1: A fazer (high priority)
INSERT INTO public.tasks (
  id, title, description, status, priority, frente,
  assigned_to, created_by, due_date, due_time,
  source_type, tags, metadata
)
VALUES (
  '50000000-0000-0000-0000-000000000001'::uuid,
  'Otimizar título Amazon - SKU B0123456789',
  'Reescrever título para incluir keywords principais e melhorar CTR. Seguir guidelines de 200 caracteres max.',
  'a_fazer',
  'high',
  'Marketplace',
  '30000000-0000-0000-0000-000000000001'::uuid,
  '20000000-0000-0000-0000-000000000001'::uuid,
  '2026-02-25',
  '18:00',
  'marketplace_analysis',
  ARRAY['amazon', 'optimization', 'urgent'],
  '{"marketplace": "amazon", "sku": "B0123456789", "category": "Electronics"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Task 2: Fazendo (in progress)
INSERT INTO public.tasks (
  id, title, description, status, priority, frente,
  assigned_to, created_by, due_date, started_at,
  source_type, tags, metadata
)
VALUES (
  '50000000-0000-0000-0000-000000000002'::uuid,
  'Atualizar A+ Content MercadoLivre',
  'Adicionar 3-5 feature points com keywords no A+ Content da listagem.',
  'fazendo',
  'high',
  'Marketplace',
  '30000000-0000-0000-0000-000000000002'::uuid,
  '20000000-0000-0000-0000-000000000001'::uuid,
  '2026-02-24',
  '2026-02-23 09:30:00+00',
  'marketplace_analysis',
  ARRAY['mercadolivre', 'content'],
  '{"marketplace": "mercadolivre", "ml_sku": "ML987654321"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Task 3: Enviado QA
INSERT INTO public.tasks (
  id, title, description, status, priority, frente,
  assigned_to, created_by, due_date, started_at, submitted_qa_at,
  source_type, tags, metadata
)
VALUES (
  '50000000-0000-0000-0000-000000000003'::uuid,
  'Otimizar pricing strategy Shopee',
  'Analisar preços competitivos e ajustar estratégia de precificação.',
  'enviado_qa',
  'medium',
  'Marketplace',
  '30000000-0000-0000-0000-000000000003'::uuid,
  '20000000-0000-0000-0000-000000000002'::uuid,
  '2026-02-22',
  '2026-02-22 08:00:00+00',
  '2026-02-23 11:30:00+00',
  'manual',
  ARRAY['shopee', 'pricing'],
  '{"marketplace": "shopee", "category": "Fashion"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Task 4: Aprovado
INSERT INTO public.tasks (
  id, title, description, status, priority, frente,
  assigned_to, created_by, due_date, started_at, submitted_qa_at, completed_at,
  source_type, tags, metadata
)
VALUES (
  '50000000-0000-0000-0000-000000000004'::uuid,
  'Criar anúncio Ads Amazon - "Oferta Flash"',
  'Criar anúncio de produto em destaque com budget de $100/dia.',
  'aprovado',
  'high',
  'Ads',
  '30000000-0000-0000-0000-000000000004'::uuid,
  '20000000-0000-0000-0000-000000000001'::uuid,
  '2026-02-21',
  '2026-02-20 10:00:00+00',
  '2026-02-20 15:30:00+00',
  '2026-02-21 09:00:00+00',
  'manual',
  ARRAY['amazon', 'ads', 'campaign'],
  '{"marketplace": "amazon", "campaign_type": "sponsored_products", "budget": 100}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Task 5: Concluído
INSERT INTO public.tasks (
  id, title, description, status, priority, frente,
  assigned_to, created_by, due_date, started_at, submitted_qa_at, completed_at,
  source_type, tags, metadata
)
VALUES (
  '50000000-0000-0000-0000-000000000005'::uuid,
  'Atualizar descrição produto - TikTok Shop',
  'Reescrever descrição com emojis e trending keywords.',
  'concluido',
  'medium',
  'Cadastro de Produto',
  '30000000-0000-0000-0000-000000000005'::uuid,
  '20000000-0000-0000-0000-000000000002'::uuid,
  '2026-02-20',
  '2026-02-19 14:00:00+00',
  '2026-02-19 17:00:00+00',
  '2026-02-20 10:30:00+00',
  'manual',
  ARRAY['tiktok', 'description'],
  '{"marketplace": "tiktok", "shop_id": "TK12345"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. EVIDENCE (Evidências de tarefas)
-- ============================================================================

INSERT INTO public.evidence (
  id, task_id, submitted_by, evidence_type,
  file_url, file_name, comment, submitted_at
)
VALUES
(
  '60000000-0000-0000-0000-000000000001'::uuid,
  '50000000-0000-0000-0000-000000000003'::uuid,
  '30000000-0000-0000-0000-000000000003'::uuid,
  'file',
  'https://storage.supabase.co/evidence/screenshot-shopee-pricing.png',
  'screenshot-shopee-pricing.png',
  'Análise competitiva de preços - print do dashboard',
  '2026-02-23 11:25:00+00'
),
(
  '60000000-0000-0000-0000-000000000002'::uuid,
  '50000000-0000-0000-0000-000000000003'::uuid,
  '30000000-0000-0000-0000-000000000003'::uuid,
  'link',
  null,
  null,
  'Link para planilha com análise de preços',
  '2026-02-23 11:30:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. TIME_LOGS (Rastreamento de tempo)
-- ============================================================================

INSERT INTO public.time_logs (
  id, task_id, user_id, duration_minutes,
  start_time, end_time, description, is_billable, logged_at
)
VALUES
(
  '70000000-0000-0000-0000-000000000001'::uuid,
  '50000000-0000-0000-0000-000000000002'::uuid,
  '30000000-0000-0000-0000-000000000002'::uuid,
  45,
  '2026-02-23 09:30:00+00',
  '2026-02-23 10:15:00+00',
  'Pesquisa de keywords e análise de competitors',
  true,
  '2026-02-23 10:15:00+00'
),
(
  '70000000-0000-0000-0000-000000000002'::uuid,
  '50000000-0000-0000-0000-000000000002'::uuid,
  '30000000-0000-0000-0000-000000000002'::uuid,
  30,
  '2026-02-23 10:15:00+00',
  '2026-02-23 10:45:00+00',
  'Redação do A+ Content',
  true,
  '2026-02-23 10:45:00+00'
),
(
  '70000000-0000-0000-0000-000000000003'::uuid,
  '50000000-0000-0000-0000-000000000003'::uuid,
  '30000000-0000-0000-0000-000000000003'::uuid,
  120,
  '2026-02-22 08:00:00+00',
  '2026-02-22 10:00:00+00',
  'Análise completa de preços e competitors',
  true,
  '2026-02-22 10:00:00+00'
),
(
  '70000000-0000-0000-0000-000000000004'::uuid,
  '50000000-0000-0000-0000-000000000004'::uuid,
  '30000000-0000-0000-0000-000000000004'::uuid,
  90,
  '2026-02-20 10:00:00+00',
  '2026-02-20 11:30:00+00',
  'Criação de anúncio Ads com copywriting',
  true,
  '2026-02-20 11:30:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. QA_REVIEWS (Revisões de QA)
-- ============================================================================

INSERT INTO public.qa_reviews (
  id, task_id, reviewed_by, status, reason, reviewed_at
)
VALUES
(
  '80000000-0000-0000-0000-000000000001'::uuid,
  '50000000-0000-0000-0000-000000000003'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'aprovado',
  'Análise de preços completa e bem fundamentada. Recomendações alinhadas com estratégia.',
  '2026-02-23 12:00:00+00'
),
(
  '80000000-0000-0000-0000-000000000002'::uuid,
  '50000000-0000-0000-0000-000000000004'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'aprovado',
  'Anúncio criado conforme guidelines. Budget e targeting corretos.',
  '2026-02-21 10:00:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. MARKETPLACE_PLANS (Planos de análise)
-- ============================================================================

INSERT INTO public.marketplace_plans (
  id, title, description, channels, status,
  plan_data, created_by_agent, approved_by, approved_at,
  is_scheduled, scheduled_frequency, phase1_tasks_created, created_at
)
VALUES
(
  '90000000-0000-0000-0000-000000000001'::uuid,
  'Análise Estratégica - Semana 08/2026',
  'Análise completa dos 6 marketplaces com recomendações de otimização',
  ARRAY['amazon', 'mercadolivre', 'shopee', 'shein', 'tiktok', 'kaway'],
  'approved',
  '{
    "summary": "Análise estratégica de 6 marketplaces identificando quick wins e oportunidades de crescimento.",
    "opportunities": [
      {
        "id": "opp_1",
        "title": "Otimizar A+ Content Amazon",
        "impact": "high",
        "effort": "low",
        "priority": 1,
        "marketplace": "amazon",
        "description": "Adicionar 3-5 feature points com keywords principais",
        "expected_uplift": "15-20% CTR"
      },
      {
        "id": "opp_2",
        "title": "Revisar Pricing Shopee",
        "impact": "high",
        "effort": "medium",
        "priority": 2,
        "marketplace": "shopee",
        "description": "Analisar preços competitivos e ajustar estratégia",
        "expected_uplift": "8-12% revenue"
      }
    ],
    "phases": [
      {
        "id": "phase1",
        "name": "Quick Wins",
        "duration": "1-2 dias",
        "tasks": [
          {"title": "Otimizar A+ Content Amazon", "effort_hours": 2},
          {"title": "Revisar Pricing Shopee", "effort_hours": 3}
        ]
      }
    ],
    "metrics": [
      {
        "name": "Expected Revenue Increase",
        "current": 10000,
        "target": 12000,
        "unit": "USD",
        "timeframe": "30 days"
      }
    ],
    "recommendations": ["Priorizar quick wins primeiro", "Medir resultados semanalmente", "Comunicar updates ao time"]
  }'::jsonb,
  'nexo',
  '20000000-0000-0000-0000-000000000001'::uuid,
  '2026-02-23 14:30:00+00',
  true,
  'weekly',
  true,
  '2026-02-23 08:00:00+00'
),
(
  '90000000-0000-0000-0000-000000000002'::uuid,
  'Quick Analysis - Amazon Focus',
  'Análise rápida focada em otimizações Amazon',
  ARRAY['amazon'],
  'pending',
  '{
    "summary": "Análise focada em Amazon com 5 oportunidades identificadas",
    "opportunities": [
      {
        "id": "opp_1",
        "title": "Otimizar Keywords",
        "impact": "high",
        "effort": "low",
        "priority": 1,
        "marketplace": "amazon",
        "description": "Pesquisa e otimização de keywords",
        "expected_uplift": "10-15% visibility"
      }
    ],
    "phases": [
      {
        "id": "phase1",
        "name": "Implementation",
        "duration": "1 dia",
        "tasks": [
          {"title": "Otimizar keywords", "effort_hours": 2}
        ]
      }
    ],
    "metrics": [],
    "recommendations": []
  }'::jsonb,
  'nexo',
  null,
  null,
  false,
  null,
  false,
  '2026-02-23 15:00:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. AGENT_MESSAGES (Conversas com IA)
-- ============================================================================

INSERT INTO public.agent_messages (
  id, conversation_id, user_id, agent_id, role, content, message_type, created_at
)
VALUES
(
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'conv-001'::uuid,
  '20000000-0000-0000-0000-000000000001'::uuid,
  'nexo',
  'user',
  'Analisa Amazon para descobrir oportunidades de crescimento',
  'text',
  '2026-02-23 08:00:00+00'
),
(
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'conv-001'::uuid,
  null,
  'nexo',
  'assistant',
  'Iniciando análise Amazon... Coletando dados de listings, reviews, competitors...',
  'analysis',
  '2026-02-23 08:05:00+00'
),
(
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'conv-001'::uuid,
  null,
  'nexo',
  'assistant',
  'Análise completa! Identifiquei 12 oportunidades de crescimento.',
  'recommendation',
  '2026-02-23 08:15:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. SAVED_FILTERS (Filtros salvos)
-- ============================================================================

INSERT INTO public.saved_filters (
  id, user_id, name, description, filters, is_shared, is_default, created_at
)
VALUES
(
  'f0000000-0000-0000-0000-000000000001'::uuid,
  '20000000-0000-0000-0000-000000000001'::uuid,
  'Meus Tasks - A Fazer',
  'Tarefas atribuídas a mim com status a_fazer',
  '{"status": "a_fazer", "assigned_to": "20000000-0000-0000-0000-000000000001"}'::jsonb,
  false,
  true,
  '2026-02-20 10:00:00+00'
),
(
  'f0000000-0000-0000-0000-000000000002'::uuid,
  '20000000-0000-0000-0000-000000000001'::uuid,
  'Tasks Marketplace - Urgent',
  'Tasks marketplace com prioridade alta',
  '{"frente": "Marketplace", "priority": "high"}'::jsonb,
  true,
  false,
  '2026-02-21 14:30:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. NOTIFICATION_PREFERENCES (Preferências de notificação)
-- ============================================================================

INSERT INTO public.notification_preferences (
  id, user_id, email_on_task_assigned, email_on_task_approved,
  email_on_qa_review, email_digest_daily, email_digest_weekly,
  push_on_task_update, slack_notifications,
  quiet_hours_start, quiet_hours_end, created_at
)
VALUES
(
  'b0000000-0000-0000-0000-000000000001'::uuid,
  '30000000-0000-0000-0000-000000000001'::uuid,
  true, true, true, true, false,
  true, false,
  '22:00', '08:00',
  '2026-02-01 10:00:00+00'
),
(
  'b0000000-0000-0000-0000-000000000002'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  true, true, false, true, true,
  false, true,
  '21:00', '09:00',
  '2026-02-01 10:00:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. AUDIT_LOGS (Auditoria)
-- ============================================================================

INSERT INTO public.audit_logs (
  id, entity_type, entity_id, action, old_values, new_values, changed_by, changed_at
)
VALUES
(
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'task',
  '50000000-0000-0000-0000-000000000002'::uuid,
  'STATUS_CHANGE',
  '{"status": "a_fazer"}'::jsonb,
  '{"status": "fazendo"}'::jsonb,
  '30000000-0000-0000-0000-000000000002'::uuid,
  '2026-02-23 09:30:00+00'
),
(
  'c0000000-0000-0000-0000-000000000002'::uuid,
  'task',
  '50000000-0000-0000-0000-000000000002'::uuid,
  'UPDATE',
  '{"priority": "high"}'::jsonb,
  '{"priority": "medium"}'::jsonb,
  '20000000-0000-0000-0000-000000000001'::uuid,
  '2026-02-23 10:00:00+00'
),
(
  'c0000000-0000-0000-0000-000000000003'::uuid,
  'marketplace_plans',
  '90000000-0000-0000-0000-000000000001'::uuid,
  'APPROVAL',
  '{"status": "pending"}'::jsonb,
  '{"status": "approved"}'::jsonb,
  '20000000-0000-0000-0000-000000000001'::uuid,
  '2026-02-23 14:30:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- FINAL: Log de seeding
-- ============================================================================

DO $$
DECLARE
  user_count INT;
  task_count INT;
  plan_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO task_count FROM public.tasks;
  SELECT COUNT(*) INTO plan_count FROM public.marketplace_plans;

  RAISE NOTICE '✅ Seed data loaded successfully!';
  RAISE NOTICE '   Users: %', user_count;
  RAISE NOTICE '   Tasks: %', task_count;
  RAISE NOTICE '   Plans: %', plan_count;
END $$;
