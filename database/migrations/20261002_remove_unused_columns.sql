BEGIN;

-- avatar_url has no application reads or writes and is empty in production.
ALTER TABLE public.clients
  DROP COLUMN IF EXISTS avatar_url;

-- request_date duplicated created_at::date for every production order.
-- Keep created_at as the canonical request timestamp.
ALTER TABLE public.repair_orders
  DROP COLUMN IF EXISTS request_date;

COMMIT;
