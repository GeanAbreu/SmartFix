BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE OR REPLACE FUNCTION public.smartfix_cancel_expired_unpaid_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  affected integer;
BEGIN
  WITH expired AS (
    UPDATE public.repair_orders
    SET status = 'cancelled',
        history = history || jsonb_build_array(jsonb_build_object('status', 'cancelled', 'at', now())),
        service_details = jsonb_set(
          service_details,
          '{auditTrail}',
          COALESCE(service_details->'auditTrail', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
            'at', now(), 'actorId', 'system', 'actorRole', 'system', 'action', 'payment_expired',
            'fromStatus', 'quoted', 'toStatus', 'cancelled'
          )),
          true
        )
    WHERE status = 'quoted'
      AND COALESCE(service_details->>'paymentStatus', 'pending') <> 'confirmed'
      AND COALESCE((service_details->>'paymentExpiresAt')::timestamptz, created_at + interval '24 hours') <= now()
    RETURNING id, client_id, partner_id, device_label
  ), notifications AS (
    INSERT INTO public.workflow_records(kind, owner_id, data)
    SELECT 'notification', owner_id, jsonb_build_object(
      'message', device_label || ': OS cancelada automaticamente por falta de pagamento em 24 horas.',
      'href', href, 'read', false, 'createdAt', now()
    )
    FROM expired
    CROSS JOIN LATERAL (VALUES (client_id, '/cliente/ordens'), (partner_id, '/parceiro/ordens')) recipient(owner_id, href)
    RETURNING 1
  )
  SELECT count(*) INTO affected FROM expired;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.smartfix_cancel_expired_unpaid_orders() FROM PUBLIC;

DO $$
DECLARE job_id bigint;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'smartfix-expire-unpaid-orders';
  IF job_id IS NOT NULL THEN PERFORM cron.unschedule(job_id); END IF;
  PERFORM cron.schedule('smartfix-expire-unpaid-orders', '0 * * * *', 'SELECT public.smartfix_cancel_expired_unpaid_orders()');
END $$;

COMMIT;
