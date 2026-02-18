-- Migration 04: Seed test data for development
-- Date: 2026-02-18
-- Description: Creates test users and sample tasks for development and testing

-- ============================================================================
-- SEED DATA: Test Users
-- ============================================================================
-- NOTE: These are test user profiles. Real users come from Supabase Auth.
-- In production, users are created via NextAuth.js during login.
-- These IDs should match auth.users(id) from Supabase Auth.

-- For testing purposes, we create users with specific roles
-- IMPORTANT: Before running this migration in production:
-- 1. Create actual users in Supabase Auth first
-- 2. Replace the UUIDs below with real auth.users(id) values
-- 3. Or omit this migration and let NextAuth handle user creation

-- Test data uses fixed UUIDs for reproducibility
-- In production, use actual auth.users IDs

-- Option 1: If using this for local testing, manually update these IDs after creating test users in Supabase Auth

-- For now, we'll skip inserting test users (they come from auth.users)
-- Uncomment below once you have actual user IDs from Supabase Auth:

/*
INSERT INTO public.users (id, email, role, name, avatar_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', 'admin', 'Admin User', NULL),
  ('550e8400-e29b-41d4-a716-446655440002', 'head@example.com', 'head', 'Head Marketing', NULL),
  ('550e8400-e29b-41d4-a716-446655440003', 'executor@example.com', 'executor', 'Executor One', NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'qa@example.com', 'qa', 'QA Reviewer', NULL)
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- SEED DATA: Sample Tasks
-- ============================================================================
-- NOTE: Comment out until you have actual user IDs in the users table
-- These tasks demonstrate the workflow and are used for testing

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
*/

-- ============================================================================
-- SEED DATA: Sample Evidence
-- ============================================================================
-- NOTE: Comment out until you have actual task and user IDs

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
*/

-- ============================================================================
-- SEED DATA: Sample QA Review
-- ============================================================================

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
*/

-- ============================================================================
-- HOW TO USE THIS SEED DATA
-- ============================================================================
-- 1. Create test users in Supabase Auth:
--    - Go to Supabase Dashboard → Authentication → Users
--    - Create 4 test users:
--      * admin@example.com (role: admin)
--      * head@example.com (role: head)
--      * executor@example.com (role: executor)
--      * qa@example.com (role: qa)
--    - Note their UUIDs (shown in auth.users table)
--
-- 2. Update the UUIDs in this file:
--    Replace all '550e8400-e29b-41d4-a716-446655440XXX' values with real UUIDs
--
-- 3. Uncomment the INSERT statements
--
-- 4. Run: supabase db push
--
-- ============================================================================
-- ALTERNATIVE: Create seed data via application
-- ============================================================================
-- Instead of SQL migrations, you can:
-- 1. Let NextAuth.js create users during login
-- 2. Use the app UI to create tasks and evidence
-- 3. This is recommended for production
--
-- ============================================================================
-- Summary
-- ============================================================================
-- Commented out seed data ready for:
--   - 4 test users (admin, head, executor, qa)
--   - 3 sample tasks in different status stages
--   - 1 evidence example
--   - 1 QA review example
--
-- Instructions provided for adapting to real user IDs
