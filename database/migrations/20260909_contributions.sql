-- Additive migration for the existing MVC database. Run once with a privileged
-- migration account after backup. Does not recreate clients/partners/devices.
BEGIN;
ALTER TABLE public.client_devices ADD COLUMN IF NOT EXISTS apelido varchar(100) NOT NULL DEFAULT '';
ALTER TABLE public.client_devices ADD COLUMN IF NOT EXISTS numero_serie varchar(100) NOT NULL DEFAULT '';

-- Orders are document aggregates: triage, itemized services, status history and
-- review are committed together. Totals are derived from integer cents, avoiding
-- stale totals when quote items change. No alternate smartfix schema is created.
CREATE TABLE IF NOT EXISTS public.workflow_records (
  id uuid PRIMARY KEY,
  kind varchar(20) NOT NULL CHECK (kind IN ('order', 'notification', 'reset', 'google', 'service')),
  owner_id uuid NOT NULL,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object')
);
CREATE INDEX IF NOT EXISTS workflow_owner_kind ON public.workflow_records(owner_id, kind);
CREATE UNIQUE INDEX IF NOT EXISTS workflow_google_identity ON public.workflow_records ((data->>'subject')) WHERE kind = 'google';
-- Only the server database role may access records. Browser Supabase clients
-- must never have access to reset tokens, orders or notification recipients.
ALTER TABLE public.workflow_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workflow_records FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON public.workflow_records FROM anon; END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON public.workflow_records FROM authenticated; END IF;
END $$;
COMMIT;
