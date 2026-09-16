-- SmartFix: align the existing Supabase schema with the server models.
-- Apply after 20260909_contributions.sql as the table owner (SQL Editor).
-- Authentication is handled by SmartFix, not by Supabase Auth.
BEGIN;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.clients ALTER COLUMN id SET DEFAULT gen_random_uuid();
-- Remove only the legacy link to auth.users. Keep all client/child foreign keys.
DO $$
DECLARE constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.clients'::regclass
      AND contype = 'f'
      AND confrelid = to_regclass('auth.users')
  LOOP
    EXECUTE format('ALTER TABLE public.clients DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.partner
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS profile_image_url text,
  ADD COLUMN IF NOT EXISTS total_reviews integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS client_addresses_client_id_idx ON public.client_addresses(client_id);
CREATE INDEX IF NOT EXISTS client_devices_client_id_idx ON public.client_devices(client_id);

-- No public policies: the browser calls SmartFix's authenticated /api routes.
-- DATABASE_URL must use the table owner or a trusted server role with BYPASSRLS.
-- User isolation is enforced by the server, not auth.uid() (different auth system).
DO $$
DECLARE table_name text; browser_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['clients','client_addresses','client_devices','partner','workflow_records']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_name);
    FOREACH browser_role IN ARRAY ARRAY['anon','authenticated']
    LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, browser_role);
      END IF;
    END LOOP;
  END LOOP;
END $$;
COMMIT;
