BEGIN;
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  recipient_role varchar(10) NOT NULL CHECK (recipient_role IN ('smartfix', 'partner')),
  partner_id uuid REFERENCES public.partner(id) ON DELETE CASCADE,
  sender_role varchar(10) NOT NULL CHECK (sender_role IN ('client', 'admin', 'partner')),
  sender_id uuid NOT NULL,
  body varchar(2000) NOT NULL CHECK (length(btrim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_recipient_match CHECK ((recipient_role = 'smartfix' AND partner_id IS NULL) OR (recipient_role = 'partner' AND partner_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS support_messages_client_created_idx
  ON public.support_messages(client_id, recipient_role, partner_id, created_at, id);
CREATE INDEX IF NOT EXISTS support_messages_partner_created_idx
  ON public.support_messages(partner_id, client_id, created_at, id) WHERE partner_id IS NOT NULL;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_messages FROM PUBLIC;
DO $$ DECLARE browser_role text;
BEGIN
  FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role) THEN
      EXECUTE format('REVOKE ALL ON public.support_messages FROM %I', browser_role);
    END IF;
  END LOOP;
END $$;
COMMIT;
