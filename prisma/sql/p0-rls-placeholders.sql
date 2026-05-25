-- Row Level Security placeholders for MapAble P0 spine (Supabase / Postgres RLS)
-- Apply policies after auth.uid() is wired to profile id.

-- CREATE POLICY profile_roles_self_read ON profile_roles
--   FOR SELECT USING (auth.uid()::text = "userId");

-- CREATE POLICY consent_grants_subject_read ON consent_grants
--   FOR SELECT USING (auth.uid()::text = "subjectUserId");

-- CREATE POLICY audit_logs_admin_read ON audit_logs
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM profile_roles pr
--       WHERE pr."userId" = auth.uid()::text
--         AND pr.role = 'mapable_admin'
--         AND pr.status = 'active'
--     )
--   );
