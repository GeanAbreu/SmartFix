import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { AppError } from "@/src/errors/AppError";

export type LogisticsAddress = { streetAddress: string; city: string; state: string; postalCode: string; country?: string; lat?: number; lng?: number };
export type LogisticsQuote = { id: string; feeCents: number; currency: string; expiresAt: string; pickupEta?: string; dropoffEta?: string; stopIds: string[] };
export type LogisticsDelivery = { id: string; status: string; trackingUrl?: string; feeCents: number; driverId?: string };
type DeliveryContact = { name: string; phone: string };
type CreateDeliveryInput = { quoteId: string; orderId: string; device: string; pickup: LogisticsAddress; dropoff: LogisticsAddress; pickupContact: DeliveryContact; dropoffContact: DeliveryContact; pickupReadyAt?: string; pickupDeadlineAt?: string; quoteExpiresAt?: string; stopIds?: string[]; direction: "pickup" | "return" };
export type LogisticsWebhookEvent = { eventId: string; deliveryId: string; externalId: string; status: string; trackingUrl?: string; occurredAt: string; driverId?: string };

const STATUS_MAP: Record<string, string> = { ASSIGNING_DRIVER: "pending", ON_GOING: "pickup", PICKED_UP: "dropoff", COMPLETED: "delivered", CANCELED: "canceled", CANCELLED: "canceled", REJECTED: "failed", EXPIRED: "failed" };
const PROGRESS: Record<string, number> = { quoting: 0, creating: 1, pending: 2, pickup: 3, pickup_complete: 4, dropoff: 5, delivered: 6, completed: 6 };
export function normalizeLalamoveStatus(status: string) { return STATUS_MAP[status.toUpperCase()] || status.toLowerCase(); }
export function shouldApplyLogisticsEvent(current: { status: string; lastEventAt?: string }, event: Pick<LogisticsWebhookEvent, "status" | "occurredAt">) {
  const previousAt = current.lastEventAt ? Date.parse(current.lastEventAt) : 0; const eventAt = Date.parse(event.occurredAt);
  if (!Number.isFinite(eventAt) || eventAt < previousAt) return false;
  const previousRank = PROGRESS[current.status]; const nextRank = PROGRESS[event.status];
  return !(previousRank !== undefined && nextRank !== undefined && nextRank < previousRank) && !(current.status === "delivered" && event.status !== "delivered");
}
export function hasProcessedLogisticsEvent(events: Array<{ id: string }>, eventId: string) { return events.some((event) => event.id === eventId); }

function settings() {
  const apiKey = process.env.LALAMOVE_API_KEY?.trim(); const apiSecret = process.env.LALAMOVE_API_SECRET?.trim();
  if (!apiKey || !apiSecret) throw new AppError("A logística integrada ainda não foi configurada.", 503, "LOGISTICS_NOT_CONFIGURED");
  const sandbox = process.env.LALAMOVE_SANDBOX !== "false";
  const apiUrl = (process.env.LALAMOVE_API_URL || (sandbox ? "https://rest.sandbox.lalamove.com" : "https://rest.lalamove.com")).replace(/\/$/, "");
  if (!/^https:\/\//.test(apiUrl)) throw new AppError("URL da Lalamove inválida.", 500, "LOGISTICS_CONFIGURATION_INVALID");
  return { apiKey, apiSecret, apiUrl, market: (process.env.LALAMOVE_MARKET || "BR").toUpperCase(), serviceType: process.env.LALAMOVE_SERVICE_TYPE || "MOTORCYCLE" };
}
export function logisticsConfigured() { return Boolean(process.env.LALAMOVE_API_KEY?.trim() && process.env.LALAMOVE_API_SECRET?.trim()); }
export function createLalamoveSignature(secret: string, timestamp: string, method: string, path: string, body = "") { return createHmac("sha256", secret).update(`${timestamp}\r\n${method.toUpperCase()}\r\n${path}\r\n\r\n${body}`).digest("hex"); }
function safeTrackingUrl(value: unknown) { if (typeof value !== "string") return undefined; try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : undefined; } catch { return undefined; } }
function moneyToCents(value: unknown) { const valueText = String(value); if (!/^\d+(?:\.\d{1,2})?$/.test(valueText)) throw new AppError("Preço logístico inválido.", 502, "LOGISTICS_PROVIDER_ERROR"); const [whole, decimal = ""] = valueText.split("."); return Number(whole) * 100 + Number(decimal.padEnd(2, "0")); }
function providerError(status: number, message: string) {
  const known: Record<string, [string, number, string]> = { ERR_OUT_OF_SERVICE_AREA: ["A Lalamove não atende esta rota no momento.", 422, "LOGISTICS_OUT_OF_COVERAGE"], ERR_QUOTATION_EXPIRED: ["A cotação expirou. Solicite uma nova cotação.", 409, "LOGISTICS_QUOTE_EXPIRED"], ERR_INSUFFICIENT_CREDIT: ["A entrega está temporariamente indisponível por saldo operacional.", 503, "LOGISTICS_INSUFFICIENT_CREDIT"], ERR_CANCELLATION_FORBIDDEN: ["Esta entrega já não pode ser cancelada.", 409, "LOGISTICS_CANCELLATION_FORBIDDEN"] };
  const mapped = known[message]; if (mapped) return new AppError(...mapped);
  if (status === 429) return new AppError("A Lalamove está ocupada. Tente novamente em instantes.", 503, "LOGISTICS_RATE_LIMITED");
  return new AppError("O provedor logístico não aceitou a solicitação.", status >= 500 ? 502 : 422, "LOGISTICS_PROVIDER_ERROR");
}
async function lalamoveRequest(method: string, path: string, data?: Record<string, unknown>, requestId: string = randomUUID()) {
  const config = settings(); const body = data ? JSON.stringify({ data }) : ""; const timestamp = Date.now().toString(); let response: Response;
  try { response = await fetch(`${config.apiUrl}${path}`, { method, cache: "no-store", body: body || undefined, signal: AbortSignal.timeout(15_000), headers: { Authorization: `hmac ${config.apiKey}:${timestamp}:${createLalamoveSignature(config.apiSecret, timestamp, method, path, body)}`, Market: config.market, "Request-ID": requestId, ...(body ? { "Content-Type": "application/json" } : {}) } }); }
  catch (cause) { throw new AppError(cause instanceof DOMException && cause.name === "TimeoutError" ? "A Lalamove demorou para responder." : "A Lalamove está indisponível.", 504, "LOGISTICS_TIMEOUT"); }
  if (response.status === 204) return {};
  const payload = await response.json().catch(() => ({})) as { data?: Record<string, unknown>; message?: string };
  if (!response.ok) throw providerError(response.status, payload.message || ""); return payload.data || {};
}
function validateAddress(address: LogisticsAddress) {
  const postalCode = address.postalCode.replace(/\D/g, ""); const state = address.state.trim().toUpperCase();
  if (!address.streetAddress.trim() || !address.city.trim() || !/^[A-Z]{2}$/.test(state) || !/^\d{8}$/.test(postalCode) || (address.country || "BR") !== "BR") throw new AppError("Endereço logístico inválido. Confira logradouro, cidade, UF e CEP.", 422, "LOGISTICS_ADDRESS_INVALID");
  if (!Number.isFinite(address.lat) || !Number.isFinite(address.lng) || Math.abs(address.lat!) > 90 || Math.abs(address.lng!) > 180) throw new AppError("Não foi possível validar as coordenadas do endereço.", 422, "LOGISTICS_COORDINATES_INVALID");
  return { coordinates: { lat: String(address.lat), lng: String(address.lng) }, address: `${address.streetAddress}, ${address.city}/${state}, ${postalCode}` };
}
function phone(value: string) { const digits = value.replace(/\D/g, ""); const national = digits.startsWith("55") ? digits : `55${digits}`; if (!/^55[1-9]\d{9,10}$/.test(national)) throw new AppError("Telefone logístico inválido. Use DDD e número válidos.", 422, "LOGISTICS_PHONE_INVALID"); return `+${national}`; }

export async function quotePickup(pickup: LogisticsAddress, dropoff: LogisticsAddress): Promise<LogisticsQuote> {
  const config = settings(); const body = await lalamoveRequest("POST", "/v3/quotations", { serviceType: config.serviceType, language: "pt_BR", stops: [validateAddress(pickup), validateAddress(dropoff)] });
  const price = body.priceBreakdown as Record<string, unknown> | undefined; const stops = Array.isArray(body.stops) ? body.stops as Array<Record<string, unknown>> : [];
  if (typeof body.quotationId !== "string" || typeof body.expiresAt !== "string" || !price || typeof price.currency !== "string" || stops.length < 2) throw new AppError("Cotação logística inválida.", 502, "LOGISTICS_PROVIDER_ERROR");
  return { id: body.quotationId, feeCents: moneyToCents(price.total), currency: price.currency, expiresAt: body.expiresAt, stopIds: stops.map((s) => String(s.stopId)) };
}
export async function createDelivery(input: CreateDeliveryInput): Promise<LogisticsDelivery> {
  if (input.quoteExpiresAt && (!Number.isFinite(Date.parse(input.quoteExpiresAt)) || Date.parse(input.quoteExpiresAt) <= Date.now() + 5_000)) throw new AppError("A cotação logística expirou. Solicite uma nova cotação.", 409, "LOGISTICS_QUOTE_EXPIRED");
  if (!input.stopIds || input.stopIds.length < 2) throw new AppError("Cotação sem paradas válidas.", 409, "LOGISTICS_QUOTE_INVALID");
  const body = await lalamoveRequest("POST", "/v3/orders", { quotationId: input.quoteId, sender: { stopId: input.stopIds[0], name: input.pickupContact.name.slice(0, 100), phone: phone(input.pickupContact.phone) }, recipients: [{ stopId: input.stopIds[1], name: input.dropoffContact.name.slice(0, 100), phone: phone(input.dropoffContact.phone), remarks: `SmartFix — ${input.device}`.slice(0, 1500) }], isPODEnabled: true, metadata: { smartfixRef: `smartfix-${input.orderId}-${input.direction}` } });
  if (typeof body.orderId !== "string" || typeof body.status !== "string") throw new AppError("Entrega logística inválida.", 502, "LOGISTICS_PROVIDER_ERROR");
  const price = body.priceBreakdown as Record<string, unknown> | undefined; const trackingUrl = safeTrackingUrl(body.shareLink);
  if (body.shareLink && !trackingUrl) throw new AppError("A Lalamove retornou um link de rastreamento inseguro.", 502, "LOGISTICS_TRACKING_URL_INVALID");
  return { id: body.orderId, status: normalizeLalamoveStatus(body.status), feeCents: price ? moneyToCents(price.total) : 0, trackingUrl, driverId: typeof body.driverId === "string" && body.driverId ? body.driverId : undefined };
}
export async function getDelivery(id: string) { return lalamoveRequest("GET", `/v3/orders/${encodeURIComponent(id)}`); }
export async function cancelDelivery(id: string) { await lalamoveRequest("DELETE", `/v3/orders/${encodeURIComponent(id)}`); }
export function verifyLogisticsWebhook(rawBody: string, authorization: string | null, path = "/api/logistics/lalamove/webhook") {
  const secret = process.env.LALAMOVE_API_SECRET?.trim(); const key = process.env.LALAMOVE_API_KEY?.trim(); const match = /^hmac\s+([^:]+):(\d+):([a-f0-9]{64})$/i.exec(authorization?.trim() || "");
  if (!secret || !key || !match || match[1] !== key || Math.abs(Date.now() - Number(match[2])) > 5 * 60_000) return false;
  const expected = createLalamoveSignature(secret, match[2], "POST", path, rawBody); const received = match[3].toLowerCase(); return expected.length === received.length && timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
function text(value: unknown) { return typeof value === "string" ? value : undefined; }
export function parseLogisticsWebhook(rawBody: string): LogisticsWebhookEvent {
  let body: Record<string, unknown>; try { body = JSON.parse(rawBody); } catch { throw new AppError("Webhook logístico inválido.", 400, "INVALID_WEBHOOK"); }
  const data = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {}; const order = data.order && typeof data.order === "object" ? data.order as Record<string, unknown> : data; const metadata = order.metadata && typeof order.metadata === "object" ? order.metadata as Record<string, unknown> : {};
  const deliveryId = text(order.orderId); const externalId = text(metadata.smartfixRef); const rawStatus = text(order.status); const occurredAt = text(data.updatedAt) || text(body.updatedAt); const parsedAt = occurredAt ? new Date(occurredAt) : new Date(NaN);
  if (!deliveryId || !externalId || !rawStatus || !Number.isFinite(parsedAt.getTime())) throw new AppError("Webhook logístico incompleto.", 400, "INVALID_WEBHOOK");
  return { eventId: `${text(body.eventType) || "UPDATE"}:${deliveryId}:${rawStatus}:${parsedAt.toISOString()}`, deliveryId, externalId, status: normalizeLalamoveStatus(rawStatus), trackingUrl: safeTrackingUrl(order.shareLink), occurredAt: parsedAt.toISOString(), driverId: text(order.driverId) };
}
export function deliveryWindow() { const now = new Date().toISOString(); return { readyAt: now, deadlineAt: now }; }
