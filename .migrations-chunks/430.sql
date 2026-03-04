/**
 * Migration: Create marketplace_job_executions table
 * Tracks job execution for audit trail and polling
 * Date: 2026-02-23
 */

CREATE TABLE IF NOT EXISTS marketplace_job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES marketplace_plans(id) ON DELETE CASCADE,
  job_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, active, completed, failed
  error_message TEXT,
  attempt_number INT DEFAULT 1,
  max_attempts INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  result JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);