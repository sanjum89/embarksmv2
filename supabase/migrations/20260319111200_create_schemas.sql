-- Create application schemas for the shared embark-sksm Supabase project.
-- Each app owns its own schema to prevent table name collisions.

CREATE SCHEMA IF NOT EXISTS embarksmv2;
CREATE SCHEMA IF NOT EXISTS embarksk;

-- embarksmv2 grants
GRANT USAGE ON SCHEMA embarksmv2 TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA embarksmv2 TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA embarksmv2 TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA embarksmv2 TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA embarksmv2
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA embarksmv2
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA embarksmv2
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- embarksk grants
GRANT USAGE ON SCHEMA embarksk TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA embarksk TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA embarksk TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA embarksk TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA embarksk
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA embarksk
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA embarksk
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
