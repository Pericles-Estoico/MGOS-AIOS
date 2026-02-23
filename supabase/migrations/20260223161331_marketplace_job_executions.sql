/**
 * Migration: Create marketplace_job_executions table
 * Tracks job execution for audit trail and polling
 * Date: 2026-02-23
 */

-- Create marketplace_job_executions table
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

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_executions_plan_id ON marketplace_job_executions(plan_id);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON marketplace_job_executions(status);
CREATE INDEX IF NOT EXISTS idx_job_executions_job_id ON marketplace_job_executions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_executions_created_at ON marketplace_job_executions(created_at DESC);

-- Enable RLS
ALTER TABLE marketplace_job_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow admin and head to view all job executions
CREATE POLICY "Admin and head can view all job executions"
  ON marketplace_job_executions
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'head')
    OR auth.jwt() ->> 'role' = 'qa'
  );

-- RLS Policy: Allow admin and head to insert job executions
CREATE POLICY "Admin and head can insert job executions"
  ON marketplace_job_executions
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'head')
  );

-- RLS Policy: Allow admin and head to update job executions
CREATE POLICY "Admin and head can update job executions"
  ON marketplace_job_executions
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'head')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'head')
  );

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_marketplace_job_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_marketplace_job_executions_updated_at ON marketplace_job_executions;
CREATE TRIGGER trigger_update_marketplace_job_executions_updated_at
  BEFORE UPDATE ON marketplace_job_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_job_executions_updated_at();
