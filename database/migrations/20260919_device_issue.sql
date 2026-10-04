-- Keep the problem fields available in both the legacy client_devices table
-- and the current devices table after the DER rename.
DO $$
BEGIN
  IF to_regclass('public.client_devices') IS NOT NULL THEN
    ALTER TABLE public.client_devices
      ADD COLUMN IF NOT EXISTS issue_type text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS issue_description text NOT NULL DEFAULT '';
  END IF;

  IF to_regclass('public.devices') IS NOT NULL THEN
    ALTER TABLE public.devices
      ADD COLUMN IF NOT EXISTS issue_type text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS issue_description text NOT NULL DEFAULT '';
  END IF;
END $$;
