-- Normalize addresses for clients AND partners; apply after the other migrations.
-- db:migrate saves a local, git-ignored backup before applying this migration.
BEGIN;
SET LOCAL lock_timeout = '10s';
LOCK TABLE public.clients, public.partner, public.client_addresses IN ACCESS EXCLUSIVE MODE;

ALTER TABLE public.client_addresses
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partner(id) ON DELETE CASCADE;
ALTER TABLE public.client_addresses ALTER COLUMN client_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.client_addresses'::regclass AND conname = 'client_addresses_exactly_one_owner') THEN
    ALTER TABLE public.client_addresses ADD CONSTRAINT client_addresses_exactly_one_owner
      CHECK ((client_id IS NOT NULL)::int + (partner_id IS NOT NULL)::int = 1);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS client_addresses_partner_id_idx ON public.client_addresses(partner_id);

-- Preserve every legacy address not already present, before dropping any column.
-- COALESCE retains incomplete legacy addresses without inventing missing details.
DO $$
DECLARE source_table text; owner_column text;
BEGIN
  FOREACH source_table IN ARRAY ARRAY['clients', 'partner']
  LOOP
    owner_column := CASE WHEN source_table = 'clients' THEN 'client_id' ELSE 'partner_id' END;
    IF EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = source_table AND column_name = 'cep') THEN
      EXECUTE format($migration$
        INSERT INTO public.client_addresses
          (%I, apelido, cep, logradouro, numero, complemento, bairro, municipio, uf, is_principal)
        SELECT src.id, 'Migrado', coalesce(src.cep,''), coalesce(src.logradouro,''),
          coalesce(src.numero,''), src.complemento, coalesce(src.bairro,''),
          coalesce(src.municipio,''), coalesce(src.uf,''),
          NOT EXISTS (SELECT 1 FROM public.client_addresses a WHERE a.%I = src.id)
        FROM public.%I src
        WHERE (coalesce(src.cep,'') <> '' OR coalesce(src.logradouro,'') <> ''
           OR coalesce(src.numero,'') <> '' OR coalesce(src.complemento,'') <> ''
           OR coalesce(src.bairro,'') <> '' OR coalesce(src.municipio,'') <> '' OR coalesce(src.uf,'') <> '')
          AND NOT EXISTS (
            SELECT 1 FROM public.client_addresses a WHERE a.%I = src.id
              AND coalesce(a.cep,'') = coalesce(src.cep,'')
              AND coalesce(a.logradouro,'') = coalesce(src.logradouro,'')
              AND coalesce(a.numero,'') = coalesce(src.numero,'')
              AND coalesce(a.complemento,'') = coalesce(src.complemento,'')
              AND coalesce(a.bairro,'') = coalesce(src.bairro,'')
              AND coalesce(a.municipio,'') = coalesce(src.municipio,'')
              AND coalesce(a.uf,'') = coalesce(src.uf,'')
          )
      $migration$, owner_column, owner_column, source_table, owner_column);
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.clients
  DROP COLUMN IF EXISTS cep, DROP COLUMN IF EXISTS logradouro,
  DROP COLUMN IF EXISTS numero, DROP COLUMN IF EXISTS complemento,
  DROP COLUMN IF EXISTS bairro, DROP COLUMN IF EXISTS municipio, DROP COLUMN IF EXISTS uf;
ALTER TABLE public.partner
  DROP COLUMN IF EXISTS cep, DROP COLUMN IF EXISTS logradouro,
  DROP COLUMN IF EXISTS numero, DROP COLUMN IF EXISTS complemento,
  DROP COLUMN IF EXISTS bairro, DROP COLUMN IF EXISTS municipio, DROP COLUMN IF EXISTS uf,
  DROP COLUMN IF EXISTS data_nascimento, DROP COLUMN IF EXISTS specialty,
  DROP COLUMN IF EXISTS bio, DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude, DROP COLUMN IF EXISTS profile_image_url,
  DROP COLUMN IF EXISTS rating, DROP COLUMN IF EXISTS total_reviews;
COMMIT;
