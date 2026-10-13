-- Replace every UUID primary/foreign key with a sequential BIGINT.
-- Existing rows are deterministically renumbered and all relationships are
-- rebuilt in the same transaction. Applying this invalidates old sessions.
BEGIN;
SET LOCAL lock_timeout = '15s';
LOCK TABLE public.clients, public.partner, public.client_addresses, public.devices,
  public.repair_orders, public.reviews, public.partner_services,
  public.support_messages, public.workflow_records IN ACCESS EXCLUSIVE MODE;

CREATE TEMP TABLE _clients_map AS
  SELECT id old_id, row_number() OVER (ORDER BY created_at, id)::bigint new_id FROM public.clients;
CREATE TEMP TABLE _partners_map AS
  SELECT id old_id, (row_number() OVER (ORDER BY created_at, id)+(SELECT count(*) FROM public.clients))::bigint new_id FROM public.partner;
CREATE TEMP TABLE _addresses_map AS
  SELECT id old_id, row_number() OVER (ORDER BY id)::bigint new_id FROM public.client_addresses;
CREATE TEMP TABLE _devices_map AS
  SELECT id old_id, row_number() OVER (ORDER BY id)::bigint new_id FROM public.devices;
CREATE TEMP TABLE _orders_map AS
  SELECT id old_id, row_number() OVER (ORDER BY created_at, id)::bigint new_id FROM public.repair_orders;
CREATE TEMP TABLE _reviews_map AS
  SELECT id old_id, row_number() OVER (ORDER BY review_date, id)::bigint new_id FROM public.reviews;
CREATE TEMP TABLE _services_map AS
  SELECT id old_id, row_number() OVER (ORDER BY created_at, id)::bigint new_id FROM public.partner_services;
CREATE TEMP TABLE _messages_map AS
  SELECT id old_id, row_number() OVER (ORDER BY created_at, id)::bigint new_id FROM public.support_messages;
CREATE TEMP TABLE _workflow_map AS
  SELECT id old_id, (row_number() OVER (ORDER BY id)+(SELECT count(*) FROM public.repair_orders))::bigint new_id FROM public.workflow_records;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.client_addresses a LEFT JOIN _clients_map c ON c.old_id=a.client_id
    LEFT JOIN _partners_map p ON p.old_id=a.partner_id WHERE c.new_id IS NULL AND p.new_id IS NULL)
    OR EXISTS (SELECT 1 FROM public.devices d LEFT JOIN _clients_map c ON c.old_id=d.user_id WHERE c.new_id IS NULL)
    OR EXISTS (SELECT 1 FROM public.repair_orders o LEFT JOIN _clients_map c ON c.old_id=o.client_id
      LEFT JOIN _partners_map p ON p.old_id=o.partner_id LEFT JOIN _devices_map d ON d.old_id=o.device_id
      WHERE c.new_id IS NULL OR p.new_id IS NULL OR d.new_id IS NULL)
    OR EXISTS (SELECT 1 FROM public.workflow_records w LEFT JOIN _clients_map c ON c.old_id=w.owner_id
      LEFT JOIN _partners_map p ON p.old_id=w.owner_id WHERE c.new_id IS NULL AND p.new_id IS NULL)
  THEN RAISE EXCEPTION 'Conversão cancelada: existem referências sem proprietário';
  END IF;
END $$;

ALTER TABLE public.clients ADD COLUMN __new_id bigint;
UPDATE public.clients t SET __new_id=m.new_id FROM _clients_map m WHERE t.id=m.old_id;
ALTER TABLE public.partner ADD COLUMN __new_id bigint;
UPDATE public.partner t SET __new_id=m.new_id FROM _partners_map m WHERE t.id=m.old_id;
ALTER TABLE public.client_addresses ADD COLUMN __new_id bigint, ADD COLUMN __new_client_id bigint, ADD COLUMN __new_partner_id bigint;
UPDATE public.client_addresses t SET
  __new_id=(SELECT new_id FROM _addresses_map WHERE old_id=t.id),
  __new_client_id=(SELECT new_id FROM _clients_map WHERE old_id=t.client_id),
  __new_partner_id=(SELECT new_id FROM _partners_map WHERE old_id=t.partner_id);
ALTER TABLE public.devices ADD COLUMN __new_id bigint, ADD COLUMN __new_user_id bigint;
UPDATE public.devices t SET __new_id=i.new_id, __new_user_id=c.new_id FROM _devices_map i, _clients_map c
  WHERE t.id=i.old_id AND t.user_id=c.old_id;
ALTER TABLE public.repair_orders ADD COLUMN __new_id bigint, ADD COLUMN __new_client_id bigint,
  ADD COLUMN __new_partner_id bigint, ADD COLUMN __new_device_id bigint;
UPDATE public.repair_orders t SET __new_id=i.new_id, __new_client_id=c.new_id,
  __new_partner_id=p.new_id, __new_device_id=d.new_id
  FROM _orders_map i, _clients_map c, _partners_map p, _devices_map d
  WHERE t.id=i.old_id AND t.client_id=c.old_id AND t.partner_id=p.old_id AND t.device_id=d.old_id;
ALTER TABLE public.reviews ADD COLUMN __new_id bigint, ADD COLUMN __new_client_id bigint,
  ADD COLUMN __new_partner_id bigint, ADD COLUMN __new_repair_order_id bigint;
UPDATE public.reviews t SET __new_id=i.new_id, __new_client_id=c.new_id,
  __new_partner_id=p.new_id, __new_repair_order_id=o.new_id
  FROM _reviews_map i, _clients_map c, _partners_map p, _orders_map o
  WHERE t.id=i.old_id AND t.client_id=c.old_id AND t.partner_id=p.old_id AND t.repair_order_id=o.old_id;
ALTER TABLE public.partner_services ADD COLUMN __new_id bigint, ADD COLUMN __new_partner_id bigint;
UPDATE public.partner_services t SET __new_id=i.new_id, __new_partner_id=p.new_id
  FROM _services_map i, _partners_map p WHERE t.id=i.old_id AND t.partner_id=p.old_id;
ALTER TABLE public.support_messages ADD COLUMN __new_id bigint, ADD COLUMN __new_client_id bigint,
  ADD COLUMN __new_partner_id bigint, ADD COLUMN __new_sender_id bigint;
UPDATE public.support_messages t SET
  __new_id=(SELECT new_id FROM _messages_map WHERE old_id=t.id),
  __new_client_id=(SELECT new_id FROM _clients_map WHERE old_id=t.client_id),
  __new_partner_id=(SELECT new_id FROM _partners_map WHERE old_id=t.partner_id),
  __new_sender_id=CASE WHEN t.sender_role='partner'
    THEN (SELECT new_id FROM _partners_map WHERE old_id=t.sender_id)
    ELSE (SELECT new_id FROM _clients_map WHERE old_id=t.sender_id) END;
ALTER TABLE public.workflow_records ADD COLUMN __new_id bigint, ADD COLUMN __new_owner_id bigint;
UPDATE public.workflow_records t SET
  __new_id=(SELECT new_id FROM _workflow_map WHERE old_id=t.id),
  __new_owner_id=coalesce((SELECT new_id FROM _clients_map WHERE old_id=t.owner_id),
    (SELECT new_id FROM _partners_map WHERE old_id=t.owner_id));

-- Rewrite account references kept in workflow JSON documents.
UPDATE public.workflow_records w SET data=jsonb_set(data, '{actorId}', to_jsonb(coalesce(c.new_id,p.new_id)::text))
FROM _clients_map c FULL JOIN _partners_map p ON false
WHERE data ? 'actorId' AND (data->>'actorId')::uuid=coalesce(c.old_id,p.old_id);

ALTER TABLE public.clients DROP COLUMN id CASCADE;
ALTER TABLE public.partner DROP COLUMN id CASCADE;
ALTER TABLE public.client_addresses DROP COLUMN id CASCADE, DROP COLUMN client_id CASCADE, DROP COLUMN partner_id CASCADE;
ALTER TABLE public.devices DROP COLUMN id CASCADE, DROP COLUMN user_id CASCADE;
ALTER TABLE public.repair_orders DROP COLUMN id CASCADE, DROP COLUMN client_id CASCADE, DROP COLUMN partner_id CASCADE, DROP COLUMN device_id CASCADE;
ALTER TABLE public.reviews DROP COLUMN id CASCADE, DROP COLUMN client_id CASCADE, DROP COLUMN partner_id CASCADE, DROP COLUMN repair_order_id CASCADE;
ALTER TABLE public.partner_services DROP COLUMN id CASCADE, DROP COLUMN partner_id CASCADE;
ALTER TABLE public.support_messages DROP COLUMN id CASCADE, DROP COLUMN client_id CASCADE, DROP COLUMN partner_id CASCADE, DROP COLUMN sender_id CASCADE;
ALTER TABLE public.workflow_records DROP COLUMN id CASCADE, DROP COLUMN owner_id CASCADE;

ALTER TABLE public.clients RENAME COLUMN __new_id TO id;
ALTER TABLE public.partner RENAME COLUMN __new_id TO id;
ALTER TABLE public.client_addresses RENAME COLUMN __new_id TO id;
ALTER TABLE public.client_addresses RENAME COLUMN __new_client_id TO client_id;
ALTER TABLE public.client_addresses RENAME COLUMN __new_partner_id TO partner_id;
ALTER TABLE public.devices RENAME COLUMN __new_id TO id;
ALTER TABLE public.devices RENAME COLUMN __new_user_id TO user_id;
ALTER TABLE public.repair_orders RENAME COLUMN __new_id TO id;
ALTER TABLE public.repair_orders RENAME COLUMN __new_client_id TO client_id;
ALTER TABLE public.repair_orders RENAME COLUMN __new_partner_id TO partner_id;
ALTER TABLE public.repair_orders RENAME COLUMN __new_device_id TO device_id;
ALTER TABLE public.reviews RENAME COLUMN __new_id TO id;
ALTER TABLE public.reviews RENAME COLUMN __new_client_id TO client_id;
ALTER TABLE public.reviews RENAME COLUMN __new_partner_id TO partner_id;
ALTER TABLE public.reviews RENAME COLUMN __new_repair_order_id TO repair_order_id;
ALTER TABLE public.partner_services RENAME COLUMN __new_id TO id;
ALTER TABLE public.partner_services RENAME COLUMN __new_partner_id TO partner_id;
ALTER TABLE public.support_messages RENAME COLUMN __new_id TO id;
ALTER TABLE public.support_messages RENAME COLUMN __new_client_id TO client_id;
ALTER TABLE public.support_messages RENAME COLUMN __new_partner_id TO partner_id;
ALTER TABLE public.support_messages RENAME COLUMN __new_sender_id TO sender_id;
ALTER TABLE public.workflow_records RENAME COLUMN __new_id TO id;
ALTER TABLE public.workflow_records RENAME COLUMN __new_owner_id TO owner_id;

DO $$ DECLARE t text; max_id bigint;
BEGIN
  CREATE SEQUENCE public.accounts_id_seq AS bigint;
  SELECT greatest(coalesce((SELECT max(id) FROM public.clients),0),coalesce((SELECT max(id) FROM public.partner),0)) INTO max_id;
  IF max_id > 0 THEN PERFORM setval('public.accounts_id_seq',max_id,true); END IF;
  ALTER TABLE public.clients ALTER COLUMN id SET NOT NULL, ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq');
  ALTER TABLE public.partner ALTER COLUMN id SET NOT NULL, ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq');
  ALTER TABLE public.clients ADD PRIMARY KEY(id);
  ALTER TABLE public.partner ADD PRIMARY KEY(id);
  CREATE SEQUENCE public.work_items_id_seq AS bigint;
  SELECT greatest(coalesce((SELECT max(id) FROM public.repair_orders),0),coalesce((SELECT max(id) FROM public.workflow_records),0)) INTO max_id;
  IF max_id > 0 THEN PERFORM setval('public.work_items_id_seq',max_id,true); END IF;
  ALTER TABLE public.repair_orders ALTER COLUMN id SET NOT NULL, ALTER COLUMN id SET DEFAULT nextval('public.work_items_id_seq');
  ALTER TABLE public.workflow_records ALTER COLUMN id SET NOT NULL, ALTER COLUMN id SET DEFAULT nextval('public.work_items_id_seq');
  ALTER TABLE public.repair_orders ADD PRIMARY KEY(id);
  ALTER TABLE public.workflow_records ADD PRIMARY KEY(id);
  FOREACH t IN ARRAY ARRAY['client_addresses','devices','reviews','partner_services','support_messages'] LOOP
    EXECUTE format('CREATE SEQUENCE public.%I_id_seq AS bigint', t);
    EXECUTE format('SELECT coalesce(max(id),0) FROM public.%I', t) INTO max_id;
    IF max_id > 0 THEN EXECUTE format('SELECT setval(%L, %s, true)', 'public.'||t||'_id_seq', max_id); END IF;
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET NOT NULL, ALTER COLUMN id SET DEFAULT nextval(%L)', t, 'public.'||t||'_id_seq');
    EXECUTE format('ALTER SEQUENCE public.%I_id_seq OWNED BY public.%I.id', t, t);
    EXECUTE format('ALTER TABLE public.%I ADD PRIMARY KEY (id)', t);
  END LOOP;
END $$;

ALTER TABLE public.client_addresses ADD CONSTRAINT client_addresses_client_id_fkey FOREIGN KEY(client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  ADD CONSTRAINT client_addresses_partner_id_fkey FOREIGN KEY(partner_id) REFERENCES public.partner(id) ON DELETE CASCADE,
  ADD CONSTRAINT client_addresses_exactly_one_owner CHECK ((client_id IS NOT NULL)::int+(partner_id IS NOT NULL)::int=1);
ALTER TABLE public.devices ALTER COLUMN user_id SET NOT NULL,
  ADD CONSTRAINT devices_user_id_fkey FOREIGN KEY(user_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  ADD CONSTRAINT devices_id_user_id_key UNIQUE(id,user_id);
ALTER TABLE public.repair_orders ALTER COLUMN client_id SET NOT NULL, ALTER COLUMN partner_id SET NOT NULL, ALTER COLUMN device_id SET NOT NULL,
  ADD FOREIGN KEY(client_id) REFERENCES public.clients(id) ON DELETE RESTRICT,
  ADD FOREIGN KEY(partner_id) REFERENCES public.partner(id) ON DELETE RESTRICT,
  ADD FOREIGN KEY(device_id) REFERENCES public.devices(id) ON DELETE RESTRICT,
  ADD CONSTRAINT repair_orders_device_owner_fkey FOREIGN KEY(device_id,client_id) REFERENCES public.devices(id,user_id) ON DELETE RESTRICT,
  ADD CONSTRAINT repair_orders_id_client_id_partner_id_key UNIQUE(id,client_id,partner_id);
ALTER TABLE public.reviews ALTER COLUMN client_id SET NOT NULL, ALTER COLUMN partner_id SET NOT NULL, ALTER COLUMN repair_order_id SET NOT NULL,
  ADD FOREIGN KEY(client_id) REFERENCES public.clients(id) ON DELETE RESTRICT,
  ADD FOREIGN KEY(partner_id) REFERENCES public.partner(id) ON DELETE RESTRICT,
  ADD UNIQUE(repair_order_id), ADD CONSTRAINT reviews_order_parties_fkey FOREIGN KEY(repair_order_id,client_id,partner_id)
    REFERENCES public.repair_orders(id,client_id,partner_id) ON DELETE CASCADE;
ALTER TABLE public.partner_services ALTER COLUMN partner_id SET NOT NULL,
  ADD FOREIGN KEY(partner_id) REFERENCES public.partner(id) ON DELETE CASCADE;
ALTER TABLE public.support_messages ALTER COLUMN client_id SET NOT NULL, ALTER COLUMN sender_id SET NOT NULL,
  ADD FOREIGN KEY(client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  ADD FOREIGN KEY(partner_id) REFERENCES public.partner(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_records ALTER COLUMN owner_id SET NOT NULL;

CREATE INDEX client_addresses_client_id_idx ON public.client_addresses(client_id);
CREATE INDEX client_addresses_partner_id_idx ON public.client_addresses(partner_id);
CREATE INDEX devices_user_id ON public.devices(user_id);
CREATE INDEX repair_orders_client_date ON public.repair_orders(client_id,created_at DESC);
CREATE INDEX repair_orders_partner_date ON public.repair_orders(partner_id,created_at DESC);
CREATE INDEX repair_orders_device_id ON public.repair_orders(device_id);
CREATE INDEX reviews_client_id ON public.reviews(client_id);
CREATE INDEX reviews_partner_id ON public.reviews(partner_id);
CREATE INDEX partner_services_partner_active_idx ON public.partner_services(partner_id,is_active,name);
CREATE INDEX support_messages_client_created_idx ON public.support_messages(client_id,recipient_role,partner_id,created_at,id);
CREATE INDEX support_messages_partner_created_idx ON public.support_messages(partner_id,client_id,created_at,id) WHERE partner_id IS NOT NULL;
CREATE INDEX workflow_owner_kind ON public.workflow_records(owner_id,kind);
COMMIT;
