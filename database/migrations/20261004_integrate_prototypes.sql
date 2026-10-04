BEGIN;
ALTER TABLE public.repair_orders
  ADD COLUMN IF NOT EXISTS service_details jsonb NOT NULL DEFAULT '{}'::jsonb
  CHECK (jsonb_typeof(service_details) = 'object');
COMMIT;
