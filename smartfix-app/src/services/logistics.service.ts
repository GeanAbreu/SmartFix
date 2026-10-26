import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "@/src/errors/AppError";

export type LogisticsAddress = {
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
};

export type LogisticsQuote = {
  id: string;
  feeCents: number;
  currency: string;
  expiresAt: string;
  pickupEta?: string;
  dropoffEta?: string;
};

export type LogisticsDelivery = {
  id: string;
  status: string;
  trackingUrl?: string;
  feeCents: number;
};

type DeliveryContact = { name: string; phone: string };
type CreateDeliveryInput = {
  quoteId: string;
  orderId: string;
  device: string;
  pickup: LogisticsAddress;
  dropoff: LogisticsAddress;
  pickupContact: DeliveryContact;
  dropoffContact: DeliveryContact;
  pickupReadyAt: string;
  pickupDeadlineAt: string;
};

export type LogisticsWebhookEvent = {
  eventId: string;
  deliveryId: string;
  externalId: string;
  status: string;
  trackingUrl?: string;
  occurredAt: string;
};

let tokenCache: { value: string; expiresAt: number } | undefined;

function settings() {
  const clientId = process.env.UBER_DIRECT_CLIENT_ID?.trim();
  const clientSecret = process.env.UBER_DIRECT_CLIENT_SECRET?.trim();
  const customerId = process.env.UBER_DIRECT_CUSTOMER_ID?.trim();
  if (!clientId || !clientSecret || !customerId)
    throw new AppError("A logística integrada ainda não foi configurada.", 503, "LOGISTICS_NOT_CONFIGURED");
  return {
    clientId, clientSecret, customerId,
    apiUrl: (process.env.UBER_DIRECT_API_URL || "https://api.uber.com").replace(/\/$/, ""),
    authUrl: process.env.UBER_DIRECT_AUTH_URL || "https://auth.uber.com/oauth/v2/token",
  };
}

async function parseProviderResponse(response: Response) {
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof body.message === "string" ? body.message : "O provedor logístico não aceitou a solicitação.";
    throw new AppError(message, response.status >= 500 ? 502 : 422, "LOGISTICS_PROVIDER_ERROR");
  }
  return body;
}

async function accessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.value;
  const config = settings();
  const form = new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret,
    grant_type: "client_credentials", scope: "eats.deliveries" });
  const response = await fetch(config.authUrl, { method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form, cache: "no-store" });
  const body = await parseProviderResponse(response);
  if (typeof body.access_token !== "string")
    throw new AppError("Resposta inválida do provedor logístico.", 502, "LOGISTICS_PROVIDER_ERROR");
  tokenCache = { value: body.access_token, expiresAt: Date.now() + Number(body.expires_in || 3600) * 1000 };
  return tokenCache.value;
}

function providerAddress(address: LogisticsAddress) {
  return JSON.stringify({ street_address: [address.streetAddress], city: address.city,
    state: address.state, zip_code: address.postalCode.replace(/\D/g, ""), country: address.country || "BR" });
}

function phone(value: string) {
  const digits = value.replace(/\D/g, "");
  return `+${digits.startsWith("55") ? digits : `55${digits}`}`;
}

async function uberRequest(path: string, body: Record<string, unknown>) {
  const config = settings();
  const response = await fetch(`${config.apiUrl}/v1/customers/${encodeURIComponent(config.customerId)}${path}`, {
    method: "POST", cache: "no-store",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseProviderResponse(response);
}

export function logisticsConfigured() {
  return Boolean(process.env.UBER_DIRECT_CLIENT_ID?.trim() && process.env.UBER_DIRECT_CLIENT_SECRET?.trim()
    && process.env.UBER_DIRECT_CUSTOMER_ID?.trim());
}

export async function quotePickup(pickup: LogisticsAddress, dropoff: LogisticsAddress,
  pickupReadyAt: string, pickupDeadlineAt: string): Promise<LogisticsQuote> {
  const body = await uberRequest("/delivery_quotes", { pickup_address: providerAddress(pickup),
    dropoff_address: providerAddress(dropoff), pickup_ready_dt: pickupReadyAt, pickup_deadline_dt: pickupDeadlineAt });
  if (typeof body.id !== "string" || typeof body.fee !== "number" || typeof body.expires !== "string")
    throw new AppError("Cotação logística inválida.", 502, "LOGISTICS_PROVIDER_ERROR");
  return { id: body.id, feeCents: body.fee, currency: String(body.currency_type || body.currency || "BRL"),
    expiresAt: body.expires, pickupEta: typeof body.pickup_eta === "string" ? body.pickup_eta : undefined,
    dropoffEta: typeof body.dropoff_eta === "string" ? body.dropoff_eta : undefined };
}

export async function createPickupDelivery(input: CreateDeliveryInput): Promise<LogisticsDelivery> {
  const body = await uberRequest("/deliveries", { quote_id: input.quoteId, external_id: `smartfix-${input.orderId}-pickup`,
    pickup_address: providerAddress(input.pickup), dropoff_address: providerAddress(input.dropoff),
    pickup_name: input.pickupContact.name, pickup_phone_number: phone(input.pickupContact.phone),
    dropoff_name: input.dropoffContact.name, dropoff_phone_number: phone(input.dropoffContact.phone),
    pickup_ready_dt: input.pickupReadyAt, pickup_deadline_dt: input.pickupDeadlineAt,
    pickup_verification: { picture: true },
    dropoff_verification: { pincode: { enabled: true } },
    undeliverable_action: "return",
    manifest_items: [{ name: `Dispositivo eletrônico — ${input.device}`.slice(0, 100), quantity: 1 }] });
  if (typeof body.id !== "string" || typeof body.status !== "string")
    throw new AppError("Entrega logística inválida.", 502, "LOGISTICS_PROVIDER_ERROR");
  return { id: body.id, status: body.status, feeCents: Number(body.fee || 0),
    trackingUrl: typeof body.tracking_url === "string" ? body.tracking_url : undefined };
}

export async function createDelivery(input: CreateDeliveryInput & { direction: "pickup" | "return" }) {
  const body = await uberRequest("/deliveries", { quote_id: input.quoteId,
    external_id: `smartfix-${input.orderId}-${input.direction}`,
    pickup_address: providerAddress(input.pickup), dropoff_address: providerAddress(input.dropoff),
    pickup_name: input.pickupContact.name, pickup_phone_number: phone(input.pickupContact.phone),
    dropoff_name: input.dropoffContact.name, dropoff_phone_number: phone(input.dropoffContact.phone),
    pickup_ready_dt: input.pickupReadyAt, pickup_deadline_dt: input.pickupDeadlineAt,
    pickup_verification: { picture: true },
    dropoff_verification: { pincode: { enabled: true } },
    undeliverable_action: "return",
    manifest_items: [{ name: `Dispositivo eletrônico — ${input.device}`.slice(0, 100), quantity: 1 }] });
  if (typeof body.id !== "string" || typeof body.status !== "string")
    throw new AppError("Entrega logística inválida.", 502, "LOGISTICS_PROVIDER_ERROR");
  return { id: body.id, status: body.status, feeCents: Number(body.fee || 0),
    trackingUrl: typeof body.tracking_url === "string" ? body.tracking_url : undefined };
}

export function verifyLogisticsWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.UBER_DIRECT_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signature.trim().toLowerCase();
  return expected.length === received.length &&
    timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(received, "utf8"));
}

function text(value: unknown) { return typeof value === "string" ? value : undefined; }

export function parseLogisticsWebhook(rawBody: string): LogisticsWebhookEvent {
  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody) as Record<string, unknown>; }
  catch { throw new AppError("Webhook logístico inválido.", 400, "INVALID_WEBHOOK"); }
  const data = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {};
  const meta = body.meta && typeof body.meta === "object" ? body.meta as Record<string, unknown> : {};
  const deliveryId = text(data.id) || text(data.delivery_id) || text(meta.order_id);
  const externalId = text(data.external_id) || text(meta.external_order_id);
  const status = text(data.status) || text(meta.status);
  if (!deliveryId || !externalId || !status)
    throw new AppError("Webhook logístico incompleto.", 400, "INVALID_WEBHOOK");
  const rawTime = body.event_time ?? data.updated ?? data.updated_at;
  const date = typeof rawTime === "number"
    ? new Date(rawTime < 10_000_000_000 ? rawTime * 1000 : rawTime)
    : new Date(typeof rawTime === "string" ? rawTime : Date.now());
  return { eventId: text(body.id) || text(body.event_id) || `${deliveryId}:${status}:${date.toISOString()}`,
    deliveryId, externalId, status: status.toLowerCase(),
    trackingUrl: text(data.tracking_url), occurredAt: date.toISOString() };
}

export function deliveryWindow(date: string, period: "morning" | "afternoon") {
  const offset = process.env.LOGISTICS_TIMEZONE_OFFSET || "-03:00";
  const [start, end] = period === "morning" ? ["08:00:00", "12:00:00"] : ["13:00:00", "18:00:00"];
  return { readyAt: `${date}T${start}${offset}`, deadlineAt: `${date}T${end}${offset}` };
}
