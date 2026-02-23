-- Migration: Create marketplace_channels table
-- Purpose: Store real marketplace channel data with analytics
-- Date: 2026-02-23

CREATE TABLE IF NOT EXISTS public.marketplace_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Channel identification
  channel_key VARCHAR(50) NOT NULL UNIQUE, -- 'amazon', 'mercadolivre', 'shopee', etc
  name VARCHAR(100) NOT NULL,
  marketplace_type VARCHAR(50), -- 'marketplace' or other type
  agent_name VARCHAR(100), -- 'Alex (Amazon)', 'Marina (MercadoLivre)', etc

  -- Channel status
  status VARCHAR(20) DEFAULT 'active', -- active, paused, archived

  -- Aggregated metrics
  tasks_generated INT DEFAULT 0,
  tasks_approved INT DEFAULT 0,
  tasks_completed INT DEFAULT 0,
  tasks_rejected INT DEFAULT 0,

  approval_rate DECIMAL(5, 2) DEFAULT 0, -- percentage
  completion_rate DECIMAL(5, 2) DEFAULT 0, -- percentage
  avg_completion_time_minutes INT DEFAULT 0,

  -- Financial metrics
  revenue_7days DECIMAL(15, 2) DEFAULT 0,
  opportunities_count INT DEFAULT 0,
  total_items INT DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0, -- percentage

  -- Timestamps
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.marketplace_channels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- 1. Admins can see all channels
CREATE POLICY "admin_view_all_channels" ON public.marketplace_channels
  FOR SELECT
  USING ((SELECT (auth.jwt() ->> 'role') IN ('admin', 'head')));

-- 2. Admins can update channels
CREATE POLICY "admin_update_channels" ON public.marketplace_channels
  FOR UPDATE
  USING ((SELECT (auth.jwt() ->> 'role') IN ('admin', 'head')))
  WITH CHECK ((SELECT (auth.jwt() ->> 'role') IN ('admin', 'head')));

-- 3. Users can view active channels
CREATE POLICY "user_view_active_channels" ON public.marketplace_channels
  FOR SELECT
  USING (status = 'active');

-- Create indexes for performance
CREATE INDEX idx_marketplace_channels_channel_key ON public.marketplace_channels(channel_key);
CREATE INDEX idx_marketplace_channels_status ON public.marketplace_channels(status);
CREATE INDEX idx_marketplace_channels_created_at ON public.marketplace_channels(created_at DESC);

-- Seed initial channel data
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

-- Add trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_marketplace_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_channels_updated_at_trigger
BEFORE UPDATE ON public.marketplace_channels
FOR EACH ROW
EXECUTE FUNCTION update_marketplace_channels_updated_at();
