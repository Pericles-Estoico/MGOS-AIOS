create or replace function cleanup_expired_reports()
returns void as $$
begin
  delete from report_cache
  where expires_at < now();