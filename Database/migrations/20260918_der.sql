-- DER SmartFix: preserve account IDs and own authentication; addresses remain normalized.
BEGIN;
SET LOCAL lock_timeout = '10s';

-- Rename in-place: keep rows, UUIDs and existing foreign keys.
DO $$
DECLARE item record;
BEGIN
  IF to_regclass('public.devices') IS NULL THEN
    ALTER TABLE public.client_devices RENAME TO devices;
  END IF;
  FOR item IN SELECT * FROM (VALUES
    ('clients','nome','full_name'), ('clients','telefone','phone'),
    ('clients','cpf','tax_id'), ('clients','data_nascimento','birth_date'),
    ('clients','senha','password_hash'), ('clients','criado_em','created_at'),
    ('partner','nome','full_name'), ('partner','telefone','phone'),
    ('partner','cnpj','tax_id'), ('partner','senha','password_hash'),
    ('partner','criado_em','created_at'),
    ('devices','client_id','user_id'), ('devices','tipo','device_type'),
    ('devices','marca','brand'), ('devices','modelo','model'),
    ('devices','foto_url','photo_url'), ('devices','apelido','nickname'),
    ('devices','numero_serie','serial_number')
  ) AS mapping(table_name, old_name, new_name)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public'
      AND c.table_name=item.table_name AND c.column_name=item.old_name) THEN
      EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO %I',
        item.table_name, item.old_name, item.new_name);
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS issue_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS issue_description text NOT NULL DEFAULT '';
-- user_id references the client's own SmartFix account ID (no Supabase Auth).
ALTER TABLE public.devices ALTER COLUMN user_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS devices_id_user_id ON public.devices(id, user_id);
CREATE INDEX IF NOT EXISTS devices_user_id ON public.devices(user_id);

CREATE TABLE IF NOT EXISTS public.repair_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN
    ('pending','quoted','approved','in_progress','waiting_parts','ready','completed','cancelled')),
  request_date date NOT NULL DEFAULT current_date,
  estimated_budget numeric(12,2) CHECK (estimated_budget >= 0),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  partner_id uuid NOT NULL REFERENCES public.partner(id) ON DELETE RESTRICT,
  device_id uuid NOT NULL REFERENCES public.devices(id) ON DELETE RESTRICT,
  CONSTRAINT repair_orders_device_owner_fkey FOREIGN KEY (device_id, client_id)
    REFERENCES public.devices(id, user_id) ON DELETE RESTRICT,
  UNIQUE (id, client_id, partner_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  device_label text NOT NULL,
  diagnosis text NOT NULL DEFAULT '',
  symptoms jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(symptoms)='array'),
  checklist jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(checklist)='array'),
  quote jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(quote)='array'),
  history jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(history)='array')
);
CREATE INDEX IF NOT EXISTS repair_orders_client_date ON public.repair_orders(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS repair_orders_partner_date ON public.repair_orders(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS repair_orders_device_id ON public.repair_orders(device_id);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  review_date date NOT NULL DEFAULT current_date,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  partner_id uuid NOT NULL REFERENCES public.partner(id) ON DELETE RESTRICT,
  repair_order_id uuid NOT NULL UNIQUE REFERENCES public.repair_orders(id) ON DELETE CASCADE,
  CONSTRAINT reviews_order_parties_fkey FOREIGN KEY (repair_order_id, client_id, partner_id)
    REFERENCES public.repair_orders(id, client_id, partner_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS reviews_client_id ON public.reviews(client_id);
CREATE INDEX IF NOT EXISTS reviews_partner_id ON public.reviews(partner_id);

CREATE OR REPLACE FUNCTION public.smartfix_require_completed_review()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.repair_orders
    WHERE id = NEW.repair_order_id AND status = 'completed') THEN
    RAISE EXCEPTION 'Only completed repair orders can be reviewed' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.smartfix_require_completed_review() FROM PUBLIC;
DROP TRIGGER IF EXISTS reviews_completed_order ON public.reviews;
CREATE TRIGGER reviews_completed_order BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.smartfix_require_completed_review();

-- Migrate existing JSON documents without discarding triage, quotes or history.
-- Any malformed/orphan record aborts the entire migration, keeping the source.
INSERT INTO public.repair_orders
  (id, client_id, partner_id, device_id, problem_description, status, request_date,
   estimated_budget, created_at, device_label, diagnosis, symptoms, checklist, quote, history)
SELECT w.id, (data->>'clientId')::uuid, (data->>'partnerId')::uuid, (data->>'deviceId')::uuid,
  data->>'problem', data->>'status', (data->>'createdAt')::timestamptz::date,
  CASE WHEN jsonb_array_length(coalesce(data->'quote','[]')) > 0 THEN
    (SELECT sum((i->>'quantity')::numeric * (i->>'unitPriceCents')::numeric) / 100
     FROM jsonb_array_elements(data->'quote') i) ELSE NULL END,
  (data->>'createdAt')::timestamptz, coalesce(data->>'device',''),
  coalesce(data->>'diagnosis',''), coalesce(data->'symptoms','[]'),
  coalesce(data->'checklist','[]'), coalesce(data->'quote','[]'), coalesce(data->'history','[]')
FROM public.workflow_records w WHERE kind='order';
INSERT INTO public.reviews (id, rating, comment, review_date, client_id, partner_id, repair_order_id)
SELECT w.id, (data->'review'->>'rating')::int, coalesce(data->'review'->>'comment',''),
  -- Legacy documents did not record a review date; use the order's latest status date.
  coalesce((data->'history'->-1->>'at')::timestamptz, (data->>'createdAt')::timestamptz)::date,
  (data->>'clientId')::uuid, (data->>'partnerId')::uuid, w.id
FROM public.workflow_records w WHERE kind='order' AND jsonb_typeof(data->'review')='object';
DELETE FROM public.workflow_records WHERE kind='order';
ALTER TABLE public.workflow_records DROP CONSTRAINT IF EXISTS workflow_records_kind_check;
ALTER TABLE public.workflow_records ADD CONSTRAINT workflow_records_kind_check
  CHECK (kind IN ('notification','reset','google','service'));

DO $$
DECLARE table_name text; browser_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['clients','partner','devices','client_addresses','repair_orders','reviews','workflow_records']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_name);
    FOREACH browser_role IN ARRAY ARRAY['anon','authenticated']
    LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=browser_role) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, browser_role);
      END IF;
    END LOOP;
  END LOOP;
END $$;
COMMIT;
