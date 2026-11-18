-- Credenciais OAuth do Mercado Pago para Split Payments 1:1.
-- Tokens são criptografados pela aplicação antes de serem persistidos.
ALTER TABLE public.partner
  ADD COLUMN IF NOT EXISTS mercado_pago_access_token text,
  ADD COLUMN IF NOT EXISTS mercado_pago_refresh_token text,
  ADD COLUMN IF NOT EXISTS mercado_pago_user_id text,
  ADD COLUMN IF NOT EXISTS mercado_pago_token_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS partner_mercado_pago_user_id_idx
  ON public.partner (mercado_pago_user_id)
  WHERE mercado_pago_user_id IS NOT NULL;
