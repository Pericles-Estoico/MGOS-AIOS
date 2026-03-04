ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT NULL
  CHECK (channel IS NULL OR channel IN ('amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway'));