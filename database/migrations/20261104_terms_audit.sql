ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version varchar(20);

ALTER TABLE public.partner
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version varchar(20);

UPDATE public.clients SET terms_accepted_at = COALESCE(terms_accepted_at, created_at),
  terms_version = COALESCE(terms_version, 'legacy');
UPDATE public.partner SET terms_accepted_at = COALESCE(terms_accepted_at, created_at),
  terms_version = COALESCE(terms_version, 'legacy');

ALTER TABLE public.clients ALTER COLUMN terms_accepted_at SET NOT NULL,
  ALTER COLUMN terms_version SET NOT NULL;
ALTER TABLE public.partner ALTER COLUMN terms_accepted_at SET NOT NULL,
  ALTER COLUMN terms_version SET NOT NULL;
