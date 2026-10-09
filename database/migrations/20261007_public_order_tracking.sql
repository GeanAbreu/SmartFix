BEGIN;

ALTER TABLE public.repair_orders
  ADD COLUMN IF NOT EXISTS tracking_token_nonce text,
  ADD COLUMN IF NOT EXISTS tracking_token_hash varchar(64);

CREATE UNIQUE INDEX IF NOT EXISTS repair_orders_tracking_token_hash
  ON public.repair_orders(tracking_token_hash)
  WHERE tracking_token_hash IS NOT NULL;

COMMIT;
