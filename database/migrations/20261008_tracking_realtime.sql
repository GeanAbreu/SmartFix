BEGIN;

-- Supabase Broadcast envia somente um sinal de invalidação. A tela consulta
-- novamente a API pública, que continua responsável por filtrar os dados.
DO $$
BEGIN
  IF to_regprocedure('realtime.send(jsonb,text,text,boolean)') IS NOT NULL THEN
    EXECUTE $function$
      CREATE OR REPLACE FUNCTION public.smartfix_broadcast_tracking_change()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = ''
      AS $body$
      BEGIN
        IF NEW.tracking_token_hash IS NOT NULL
          AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.history IS DISTINCT FROM NEW.history)
        THEN
          PERFORM realtime.send(
            '{}'::jsonb,
            'changed',
            'tracking:' || NEW.tracking_token_hash,
            false
          );
        END IF;
        RETURN NEW;
      END;
      $body$
    $function$;

    DROP TRIGGER IF EXISTS repair_orders_tracking_realtime ON public.repair_orders;
    CREATE TRIGGER repair_orders_tracking_realtime
      AFTER UPDATE OF status, history ON public.repair_orders
      FOR EACH ROW
      EXECUTE FUNCTION public.smartfix_broadcast_tracking_change();
  END IF;
END
$$;

COMMIT;
