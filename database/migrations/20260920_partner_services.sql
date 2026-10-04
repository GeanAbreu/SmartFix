-- Catálogo de serviços das assistências. Aplicar após 20260919_device_issue.sql.
BEGIN;
CREATE TABLE IF NOT EXISTS public.partner_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner(id) ON DELETE CASCADE,
  name varchar(150) NOT NULL CHECK (length(btrim(name)) > 0),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents BETWEEN 0 AND 10000000),
  estimated_days integer NOT NULL CHECK (estimated_days BETWEEN 0 AND 365),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partner_services_partner_active_idx
  ON public.partner_services(partner_id, is_active, name);

-- Preserve services created by the previous workflow_records implementation.
INSERT INTO public.partner_services
  (id, partner_id, name, description, unit_price_cents, estimated_days)
SELECT id, owner_id, data->>'name', coalesce(data->>'description', ''),
  (data->>'unitPriceCents')::integer, (data->>'estimatedDays')::integer
FROM public.workflow_records WHERE kind = 'service'
ON CONFLICT (id) DO NOTHING;
DELETE FROM public.workflow_records WHERE kind = 'service';

ALTER TABLE public.partner_services ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.partner_services FROM PUBLIC;
DO $$ DECLARE browser_role text;
BEGIN
  FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role) THEN
      EXECUTE format('REVOKE ALL ON public.partner_services FROM %I', browser_role);
    END IF;
  END LOOP;
END $$;
COMMIT;
