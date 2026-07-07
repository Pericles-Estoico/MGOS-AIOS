-- Remove FK constraints that reference auth.users on MVP tables.
-- NextAuth already guarantees user authentication at the application layer;
-- the FK here causes FK violations for dev/seed users whose UUIDs don't
-- exist in auth.users, and adds no runtime safety benefit in production.

ALTER TABLE mvp_products DROP CONSTRAINT IF EXISTS mvp_products_user_id_fkey;
ALTER TABLE mvp_stages   DROP CONSTRAINT IF EXISTS mvp_stages_responsavel_id_fkey;
ALTER TABLE mvp_costs    DROP CONSTRAINT IF EXISTS mvp_costs_created_by_fkey;
