CREATE OR REPLACE FUNCTION update_marketplace_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();