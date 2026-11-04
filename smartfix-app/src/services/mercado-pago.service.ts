import "server-only";
import { createHash } from "node:crypto";
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

function idempotencyKey(value: string) {
  const hex = createHash("sha256").update(value).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16], 16) & 3) | 8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
}

export function paymentPublicUrl() {
  const value = process.env.PAYMENT_PUBLIC_URL || process.env.APP_URL;
  if (!value) throw new AppError("Configure PAYMENT_PUBLIC_URL para receber pagamentos.", 503, "PAYMENT_NOT_CONFIGURED");
  const url = new URL(value);
  if (url.protocol !== "https:")
    throw new AppError("PAYMENT_PUBLIC_URL deve usar HTTPS.", 503, "PAYMENT_NOT_CONFIGURED");
  return url.origin;
}

export async function createPreference(input: { orderId: string; title: string; totalCents: number; payerEmail: string }) {
  const origin = paymentPublicUrl();
  const amount = (input.totalCents / 100).toFixed(2);
  const result = await mercadoPago<{ id: string; checkout_url: string }>("/v1/orders", {
    method: "POST",
    headers: { "X-Idempotency-Key": idempotencyKey(`checkout:${input.orderId}`) },
    body: JSON.stringify({
      type: "online",
      processing_mode: "manual",
      capture_mode: "automatic_async",
      total_amount: amount,
      items: [{ external_code: input.orderId, title: input.title, quantity: 1, unit_price: amount }],
      payer: { email: input.payerEmail },
      external_reference: input.orderId,
      config: {
        online: {
          success_url: `${origin}/cliente/ordens?payment=success&order=${input.orderId}`,
          pending_url: `${origin}/cliente/ordens?payment=pending&order=${input.orderId}`,
          failure_url: `${origin}/cliente/ordens?payment=failure&order=${input.orderId}`,
          auto_return: "approved",
        },
      },
    }),
  });
  const checkoutUrl = result.checkout_url;
  if (!checkoutUrl)
    throw new AppError("O Mercado Pago não retornou a URL do checkout.", 502, "PAYMENT_PROVIDER_ERROR");
  return { id: result.id, checkoutUrl };
}

export function getOrder(id: string) {
  return mercadoPago<{
    id: string; status: string; status_detail?: string; external_reference: string | null;
    total_amount: string; total_paid_amount: string; currency: string;
    transactions?: { payments?: Array<{ id: string; status: string; status_detail?: string;
      amount: string; paid_amount: string; payment_method?: { type?: string } }> };
  }>(`/v1/orders/${encodeURIComponent(id)}`);
}

export async function refundOrder(input: { orderId: string; transactionId: string; idempotencyKey: string;
  totalCents: number; amountCents?: number }) {
  const body = input.amountCents === undefined ? {} : {
    transactions: [{ id: input.transactionId, amount: (input.amountCents / 100).toFixed(2) }],
  };
  const result = await mercadoPago<{ id: string; status?: string; status_detail?: string;
    transactions?: { refunds?: Array<{ id: string; amount: string; status?: string }> } }>(
    `/v1/orders/${encodeURIComponent(input.orderId)}/refund`, {
      method: "POST",
      headers: { "X-Idempotency-Key": idempotencyKey(input.idempotencyKey) },
      body: JSON.stringify(body),
    });
  const refund = result.transactions?.refunds?.at(-1);
  return { id: refund?.id || result.id,
    amountCents: refund ? Math.round(Number(refund.amount) * 100) : input.amountCents ?? input.totalCents,
    status: refund?.status || result.status_detail || result.status || "processed" };
}
