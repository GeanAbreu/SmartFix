import "server-only";
import { AppError } from "@/src/errors/AppError";

const api = "https://api.mercadopago.com";

function token() {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN)
    throw new AppError("O Mercado Pago ainda não está configurado.", 503, "PAYMENT_NOT_CONFIGURED");
  return process.env.MERCADO_PAGO_ACCESS_TOKEN;
}

async function mercadoPago<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${api}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", ...init?.headers },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error(`Mercado Pago recusou a operação (${response.status}).`);
    throw new AppError("Não foi possível iniciar o pagamento. Tente novamente.", 502, "PAYMENT_PROVIDER_ERROR");
  }
  return response.json() as Promise<T>;
}

export function paymentPublicUrl() {
  const value = process.env.PAYMENT_PUBLIC_URL || process.env.APP_URL;
  if (!value) throw new AppError("Configure PAYMENT_PUBLIC_URL para receber pagamentos.", 503, "PAYMENT_NOT_CONFIGURED");
  return new URL(value).origin;
}

export async function createPreference(input: { orderId: string; title: string; totalCents: number; payerEmail: string }) {
  const origin = paymentPublicUrl();
  const result = await mercadoPago<{ id: string; init_point: string; sandbox_init_point?: string }>("/checkout/preferences", {
    method: "POST",
    headers: { "X-Idempotency-Key": `smartfix-${input.orderId}` },
    body: JSON.stringify({
      items: [{ id: input.orderId, title: input.title, quantity: 1, currency_id: "BRL", unit_price: input.totalCents / 100 }],
      payer: { email: input.payerEmail },
      external_reference: input.orderId,
      back_urls: {
        success: `${origin}/cliente/ordens?payment=success&order=${input.orderId}`,
        pending: `${origin}/cliente/ordens?payment=pending&order=${input.orderId}`,
        failure: `${origin}/cliente/ordens?payment=failure&order=${input.orderId}`,
      },
      notification_url: `${origin}/api/payments/mercado-pago/webhook`,
      statement_descriptor: "SMARTFIX",
    }),
  });
  return { id: result.id, checkoutUrl: result.init_point || result.sandbox_init_point };
}

export function getPayment(id: string) {
  return mercadoPago<{
    id: number; status: string; external_reference: string | null; transaction_amount: number;
    payment_type_id: string; preference_id?: string;
  }>(`/v1/payments/${encodeURIComponent(id)}`);
}
