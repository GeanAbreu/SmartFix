BEGIN;
ALTER TABLE IF EXISTS public.devices
  DROP COLUMN IF EXISTS serial_number,
  DROP COLUMN IF EXISTS issue_type;
ALTER TABLE IF EXISTS public.client_devices
  DROP COLUMN IF EXISTS numero_serie,
  DROP COLUMN IF EXISTS issue_type;
COMMIT;
