CREATE TABLE IF NOT EXISTS public.marketplace_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  channel_key VARCHAR(50) NOT NULL UNIQUE, -- 'amazon', 'mercadolivre', 'shopee', etc
  name VARCHAR(100) NOT NULL,
  marketplace_type VARCHAR(50), -- 'marketplace' or other type
  agent_name VARCHAR(100), -- 'Alex (Amazon)', 'Marina (MercadoLivre)', etc

  status VARCHAR(20) DEFAULT 'active', -- active, paused, archived

  tasks_generated INT DEFAULT 0,
  tasks_approved INT DEFAULT 0,
  tasks_completed INT DEFAULT 0,
  tasks_rejected INT DEFAULT 0,

  approval_rate DECIMAL(5, 2) DEFAULT 0, -- percentage
  completion_rate DECIMAL(5, 2) DEFAULT 0, -- percentage
  avg_completion_time_minutes INT DEFAULT 0,

  revenue_7days DECIMAL(15, 2) DEFAULT 0,
  opportunities_count INT DEFAULT 0,
  total_items INT DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0, -- percentage

  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);