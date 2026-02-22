-- Diagnostic script to check user role setup
-- Run this in Supabase SQL editor to debug role issues

-- Step 1: Check if user exists in auth.users
SELECT
  id,
  email,
  created_at,
  (SELECT role FROM public.users WHERE id = auth.users.id) as role_in_public_table
FROM auth.users
WHERE email = 'pericles@vidadeceo.com.br';

-- Step 2: Check all users in public.users table
SELECT id, email, role, created_at FROM public.users ORDER BY created_at DESC LIMIT 5;

-- Step 3: Check role constraints
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints
WHERE table_name = 'users' AND constraint_type = 'CHECK';

-- Step 4: If user exists in auth.users but NOT in public.users, run this:
-- INSERT INTO public.users (id, email, role, name)
-- SELECT id, email, 'ceo', 'Pericles'
-- FROM auth.users
-- WHERE email = 'pericles@vidadeceo.com.br'
-- ON CONFLICT (email) DO NOTHING;
