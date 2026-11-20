import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { AppError } from "@/src/errors/AppError";
import { Partner } from "@/src/models";
import { usesLocalAuthStore } from "./local-auth.service";
import { marketplaceFeeCents } from "./payment-split.service";

export { MARKETPLACE_FEE_PERCENT, marketplaceFeeCents } from "./payment-split.service";

const api = "https://api.mercadopago.com";
const oauthAuthorizationEndpoint = "https://auth.mercadopago.com/authorization";
export type OAuthCredentials = { accessToken: string; refreshToken: string; userId: string; expiresAt: Date };

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new AppError(`Configure ${name} para usar o marketplace.`, 503, "PAYMENT_NOT_CONFIGURED");
  return value;
}

function encryptionKey() {
  return createHash("sha256").update(requiredEnvironment("PAYMENT_CREDENTIALS_ENCRYPTION_KEY")).digest();
}

export function encryptPaymentCredential(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptPaymentCredential(value: string) {
  try {
    const parts = value.split(".");
    if (parts.length !== 3) throw new Error("invalid credential");
    const [iv, tag, encrypted] = parts.map((part) => Buffer.from(part, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    throw new AppError("As credenciais de pagamento do parceiro são inválidas. Reconecte o Mercado Pago.", 409, "PARTNER_PAYMENT_RECONNECT_REQUIRED");
  }
}

async function mercadoPago<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${api}${path}`, { ...init,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...init?.headers },
    signal: AbortSignal.timeout(12_000), cache: "no-store" });
  if (!response.ok) {
    console.error(`Mercado Pago recusou a operação (${response.status}).`);
    throw new AppError("Não foi possível concluir a operação no Mercado Pago. Tente novamente.", 502, "PAYMENT_PROVIDER_ERROR");
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
  if (url.protocol !== "https:") throw new AppError("PAYMENT_PUBLIC_URL deve usar HTTPS.", 503, "PAYMENT_NOT_CONFIGURED");
  return url.origin;
}

function redirectUri() { return `${paymentPublicUrl()}/api/partners/mercado-pago/callback`; }
function stateSecret() { return process.env.MERCADO_PAGO_OAUTH_STATE_SECRET || requiredEnvironment("SESSION_SECRET"); }

export function createOAuthState(partnerId: string, codeVerifier: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(stateSecret()).digest(), iv);
  const payload = Buffer.concat([cipher.update(JSON.stringify({ partnerId, codeVerifier,
    expiresAt: Date.now() + 10 * 60_000 }), "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${payload.toString("base64url")}`;
}

export function readOAuthState(state: string) {
  try {
    const parts = state.split(".");
    if (parts.length !== 3) throw new Error("invalid state");
    const [iv, tag, payload] = parts.map((part) => Buffer.from(part, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", createHash("sha256").update(stateSecret()).digest(), iv);
    decipher.setAuthTag(tag);
    const parsed = JSON.parse(Buffer.concat([decipher.update(payload), decipher.final()]).toString("utf8")) as
      { partnerId: string; codeVerifier: string; expiresAt: number };
    if (!parsed.partnerId || parsed.codeVerifier.length < 43 || parsed.expiresAt < Date.now()) throw new Error("expired");
    return parsed;
  } catch {
    throw new AppError("A autorização do Mercado Pago expirou. Tente conectar novamente.", 400, "INVALID_OAUTH_STATE");
  }
}

export function mercadoPagoAuthorizationUrl(partnerId: string) {
  const codeVerifier = randomBytes(48).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  const url = new URL(oauthAuthorizationEndpoint);
  url.searchParams.set("client_id", requiredEnvironment("MERCADO_PAGO_CLIENT_ID"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("state", createOAuthState(partnerId, codeVerifier));
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

async function oauthToken(body: URLSearchParams): Promise<OAuthCredentials> {
  const response = await fetch(`${api}/oauth/token`, { method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body, signal: AbortSignal.timeout(12_000), cache: "no-store" });
  if (!response.ok) throw new AppError("O Mercado Pago não autorizou a conexão. Tente novamente.", 502, "PAYMENT_OAUTH_ERROR");
  const result = await response.json() as { access_token: string; refresh_token: string; user_id: number | string; expires_in: number };
  return { accessToken: result.access_token, refreshToken: result.refresh_token, userId: String(result.user_id),
    expiresAt: new Date(Date.now() + Number(result.expires_in) * 1000) };
}

export function exchangeAuthorizationCode(code: string, codeVerifier: string) {
  return oauthToken(new URLSearchParams({ client_id: requiredEnvironment("MERCADO_PAGO_CLIENT_ID"),
    client_secret: requiredEnvironment("MERCADO_PAGO_CLIENT_SECRET"), grant_type: "authorization_code", code,
    redirect_uri: redirectUri(), code_verifier: codeVerifier }));
}

export function refreshAuthorization(refreshToken: string) {
  return oauthToken(new URLSearchParams({ client_id: requiredEnvironment("MERCADO_PAGO_CLIENT_ID"),
    client_secret: requiredEnvironment("MERCADO_PAGO_CLIENT_SECRET"), grant_type: "refresh_token", refresh_token: refreshToken }));
}

export async function savePartnerAuthorization(partnerId: string, credentials: OAuthCredentials) {
  const [updated] = await Partner.update({
    mercado_pago_access_token: encryptPaymentCredential(credentials.accessToken),
    mercado_pago_refresh_token: encryptPaymentCredential(credentials.refreshToken),
    mercado_pago_user_id: credentials.userId,
    mercado_pago_token_expires_at: credentials.expiresAt,
  }, { where: { id: partnerId } });
  if (!updated) throw new AppError("Parceiro não encontrado.", 404, "NOT_FOUND");
}

export async function partnerAccessToken(partnerId: string) {
  if (usesLocalAuthStore())
    throw new AppError("A assistência ainda não conectou a conta do Mercado Pago.", 409, "PARTNER_PAYMENT_NOT_CONNECTED");
  const partner = await Partner.unscoped().findByPk(partnerId, { attributes: ["id", "mercado_pago_access_token",
    "mercado_pago_refresh_token", "mercado_pago_token_expires_at"] });
  if (!partner?.mercado_pago_access_token || !partner.mercado_pago_refresh_token)
    throw new AppError("A assistência ainda não conectou a conta do Mercado Pago.", 409, "PARTNER_PAYMENT_NOT_CONNECTED");
  if (partner.mercado_pago_token_expires_at && partner.mercado_pago_token_expires_at.getTime() > Date.now() + 24 * 60 * 60_000)
    return decryptPaymentCredential(partner.mercado_pago_access_token);
  const refreshed = await refreshAuthorization(decryptPaymentCredential(partner.mercado_pago_refresh_token));
  await savePartnerAuthorization(partnerId, refreshed);
  return refreshed.accessToken;
}

export async function createPreference(input: { orderId: string; title: string; totalCents: number; payerEmail: string; accessToken: string }) {
  const origin = paymentPublicUrl();
  const amount = (input.totalCents / 100).toFixed(2);
  const fee = (marketplaceFeeCents(input.totalCents) / 100).toFixed(2);
  const result = await mercadoPago<{ id: string; checkout_url?: string }>("/v1/orders", input.accessToken, {
    method: "POST", headers: { "X-Idempotency-Key": idempotencyKey(`checkout:${input.orderId}`) },
    body: JSON.stringify({
      type: "online", processing_mode: "manual", capture_mode: "automatic_async",
      total_amount: amount, marketplace_fee: fee,
      items: [{ external_code: input.orderId, title: input.title, quantity: 1, unit_price: amount }],
      payer: { email: input.payerEmail },
      external_reference: input.orderId,
      config: { online: {
        success_url: `${origin}/cliente/ordens?payment=success&order=${encodeURIComponent(input.orderId)}`,
        pending_url: `${origin}/cliente/ordens?payment=pending&order=${encodeURIComponent(input.orderId)}`,
        failure_url: `${origin}/cliente/ordens?payment=failure&order=${encodeURIComponent(input.orderId)}`,
        auto_return: "approved",
      } },
    }),
  });
  if (!result.checkout_url) throw new AppError("O Mercado Pago não retornou a URL do checkout.", 502, "PAYMENT_PROVIDER_ERROR");
  return { id: result.id, checkoutUrl: result.checkout_url, marketplaceFeeCents: marketplaceFeeCents(input.totalCents) };
}

export function getPaymentOrder(id: string, accessToken: string) {
  return mercadoPago<{ id: string; status: string; status_detail?: string; external_reference: string | null;
    total_amount: string; total_paid_amount: string; currency: string;
    transactions?: { payments?: Array<{ id: string; status: string; status_detail?: string;
      amount: string; paid_amount: string; payment_method?: { type?: string } }> } }>(
    `/v1/orders/${encodeURIComponent(id)}`, accessToken);
}

export async function refundPayment(input: { orderId: string; paymentId: string; accessToken: string;
  totalCents: number; amountCents?: number }) {
  const body = input.amountCents === undefined ? {} : {
    transactions: [{ id: input.paymentId, amount: (input.amountCents / 100).toFixed(2) }],
  };
  const result = await mercadoPago<{ id: string; status?: string; status_detail?: string;
    transactions?: { refunds?: Array<{ id: string; amount: string; status?: string }> } }>(
    `/v1/orders/${encodeURIComponent(input.orderId)}/refund`, input.accessToken, {
      method: "POST", headers: { "X-Idempotency-Key": idempotencyKey(`refund:${input.orderId}:${input.amountCents ?? "total"}`) },
      body: JSON.stringify(body),
    });
  const refund = result.transactions?.refunds?.at(-1);
  return { id: refund?.id || result.id,
    amountCents: refund ? Math.round(Number(refund.amount) * 100) : input.amountCents ?? input.totalCents,
    status: refund?.status || result.status_detail || result.status || "processed" };
}
