CREATE OR REPLACE FUNCTION public.update_marketplace_subtasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();