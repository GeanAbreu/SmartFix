BEGIN;

ALTER TABLE public.partner
  ADD COLUMN IF NOT EXISTS pix_key text;

ALTER TABLE public.partner
  DROP COLUMN IF EXISTS mercado_pago_access_token,
  DROP COLUMN IF EXISTS mercado_pago_refresh_token,
  DROP COLUMN IF EXISTS mercado_pago_user_id,
  DROP COLUMN IF EXISTS mercado_pago_token_expires_at,
  DROP COLUMN IF EXISTS infinitepay_api_key,
  DROP COLUMN IF EXISTS infinitepay_handle,
  DROP COLUMN IF EXISTS infinitepay_connected_at;

DROP INDEX IF EXISTS public.repair_orders_pickup_delivery_idx;
DROP INDEX IF EXISTS public.repair_orders_return_delivery_idx;

UPDATE public.repair_orders
SET service_details = (service_details - 'logistics' - 'logisticsActualFeeCents' - 'logisticsFeeVarianceCents')
  || CASE WHEN service_details->>'paymentStatus' IN ('confirmed', 'paid')
    THEN jsonb_build_object('paymentProvider', 'infinitepay') ELSE '{}'::jsonb END;

CREATE INDEX IF NOT EXISTS workflow_order_messages_idx
  ON public.workflow_records ((data->>'orderId'), (data->>'createdAt'))
  WHERE kind = 'order_message';

COMMIT;
