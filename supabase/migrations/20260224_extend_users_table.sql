-- Migration: Extend users table with department and is_active columns
-- Date: 2026-02-24
-- Purpose: Add columns used by seed data and users API that were missing from 01-schema.sql

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.users.department IS 'Team/department the user belongs to';
COMMENT ON COLUMN public.users.is_active IS 'Soft-delete flag: false means the user is deactivated';

CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
