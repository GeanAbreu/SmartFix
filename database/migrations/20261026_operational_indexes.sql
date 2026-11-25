BEGIN;

-- Hot paths used by the customer, partner and payment dashboards.
CREATE INDEX IF NOT EXISTS repair_orders_client_created_idx
  ON public.repair_orders (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS repair_orders_partner_status_created_idx
  ON public.repair_orders (partner_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS repair_orders_payment_status_idx
  ON public.repair_orders ((service_details->>'paymentStatus'))
  WHERE service_details ? 'paymentStatus';
CREATE INDEX IF NOT EXISTS repair_orders_refund_status_idx
  ON public.repair_orders ((service_details->>'refundStatus'))
  WHERE service_details ? 'refundStatus';
CREATE INDEX IF NOT EXISTS workflow_records_owner_kind_idx
  ON public.workflow_records (owner_id, kind, id DESC);

COMMIT;
