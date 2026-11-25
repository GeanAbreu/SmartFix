import "server-only";
import { AppError } from "@/src/errors/AppError";

const API_URL = "https://api.checkout.infinitepay.io";

type PlatformCredentials = { apiKey: string; handle: string };

function required(name: "INFINITEPAY_API_KEY" | "INFINITEPAY_HANDLE") {
  const value = process.env[name]?.trim();
  if (!value) throw new AppError("O pagamento InfinitePay da SmartFix está temporariamente indisponível.", 503, "PAYMENT_NOT_CONFIGURED");
  return value;
}

export function platformInfinitePayCredentials(): PlatformCredentials {
  return { apiKey: required("INFINITEPAY_API_KEY"), handle: required("INFINITEPAY_HANDLE") };
}

function paymentPublicUrl() {
  const value = (process.env.PAYMENT_PUBLIC_URL || process.env.APP_URL)?.trim();
  if (!value) throw new AppError("A URL pública de pagamentos não foi configurada.", 503, "PAYMENT_NOT_CONFIGURED");
  return value.replace(/\/$/, "");
}

async function infinitePay<T>(path: string, apiKey: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error(`InfinitePay recusou a operação (${response.status}).`);
    if ([401, 403].includes(response.status))
      throw new AppError("A credencial InfinitePay é inválida ou não pertence à InfiniteTag informada.", 409, "INFINITEPAY_RECONNECT_REQUIRED");
    throw new AppError("Não foi possível concluir a operação na InfinitePay. Tente novamente.", 502, "PAYMENT_PROVIDER_ERROR");
  }
  return response.json() as Promise<T>;
}

export async function createInfinitePayCheckout(input: {
  orderId: string;
  title: string;
  totalCents: number;
  customer: { name: string; email: string; phone?: string };
  credentials: PlatformCredentials;
}) {
  const origin = paymentPublicUrl();
  const result = await infinitePay<Record<string, unknown>>("/links", input.credentials.apiKey, {
    handle: input.credentials.handle,
    items: [{ quantity: 1, price: input.totalCents, description: input.title }],
    order_nsu: input.orderId,
    redirect_url: `${origin}/cliente/ordens?payment=success&provider=infinitepay&order=${encodeURIComponent(input.orderId)}`,
    webhook: { url: `${origin}/api/payments/infinitepay/webhook`, events: ["paid", "settled", "refunded", "canceled", "payment_failed"] },
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      ...(input.customer.phone ? { phone_number: input.customer.phone } : {}),
    },
    options: {
      single_payment: true,
      require_delivery_address: false,
      valid_until: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      payment_methods_enabled: ["credit_card", "pix"],
    },
  });
  const checkoutUrl = [result.url, result.checkout_url, result.link].find((value): value is string => typeof value === "string");
  const slug = [result.slug, result.invoice_slug, result.id].find((value): value is string => typeof value === "string");
  if (!checkoutUrl) throw new AppError("A InfinitePay não retornou a URL do checkout.", 502, "PAYMENT_PROVIDER_ERROR");
  return { id: slug || input.orderId, checkoutUrl };
}

export function checkInfinitePayPayment(input: {
  orderId: string;
  transactionNsu: string;
  slug: string;
  credentials: PlatformCredentials;
}) {
  return infinitePay<{ success: boolean; paid: boolean; amount: number; paid_amount: number;
    installments: number; capture_method: "pix" | "credit_card" }>("/payment_check", input.credentials.apiKey, {
      handle: input.credentials.handle,
      order_nsu: input.orderId,
      transaction_nsu: input.transactionNsu,
      slug: input.slug,
    });
}
