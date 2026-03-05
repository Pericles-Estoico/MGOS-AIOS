-- Migration: Add marketplace and product_id to tasks
-- Story: produtos por marketplace + tarefas vinculadas ao canal

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS marketplace TEXT
    CHECK (marketplace IN ('shopee', 'shein', 'mercadolivre', 'amazon', 'tiktokshop', 'kaway')),
  ADD COLUMN IF NOT EXISTS product_id UUID
    REFERENCES public.products(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.tasks.marketplace IS 'Optional: marketplace channel this task relates to (shopee, shein, etc.)';
COMMENT ON COLUMN public.tasks.product_id  IS 'Optional: product this task relates to';

-- Index for filtering tasks by marketplace
CREATE INDEX IF NOT EXISTS idx_tasks_marketplace ON public.tasks (marketplace)
  WHERE marketplace IS NOT NULL;

-- Index for filtering tasks by product
CREATE INDEX IF NOT EXISTS idx_tasks_product_id ON public.tasks (product_id)
  WHERE product_id IS NOT NULL;
