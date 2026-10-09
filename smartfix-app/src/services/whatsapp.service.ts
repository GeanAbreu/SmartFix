import "server-only";
import { AppError } from "@/src/errors/AppError";
import { ORDER_LABELS, type OrderStatus } from "@/src/types/workflow";

type WhatsAppProvider = "evolution" | "zapi";

function provider(): WhatsAppProvider | null {
  const value = process.env.WHATSAPP_PROVIDER?.trim().toLowerCase();
  return value === "evolution" || value === "zapi" ? value : null;
}

export function whatsappConfigured() {
  const selected = provider();
  if (selected === "evolution")
    return Boolean(
      process.env.EVOLUTION_API_URL &&
        process.env.EVOLUTION_API_KEY &&
        process.env.EVOLUTION_INSTANCE,
    );
  if (selected === "zapi")
    return Boolean(process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN);
  return false;
}

export function normalizeWhatsAppPhone(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 || digits.length === 11) {
    const countryCode = (process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "55").replace(
      /\D/g,
      "",
    );
    digits = `${countryCode}${digits}`;
  }
  if (digits.length < 12 || digits.length > 15)
    throw new AppError(
      "O telefone do cliente não é válido para WhatsApp.",
      422,
      "INVALID_WHATSAPP_PHONE",
    );
  return digits;
}

export function orderStatusWhatsAppMessage(input: {
  clientName: string;
  orderId: string;
  device: string;
  status: OrderStatus;
}) {
  const firstName = input.clientName.trim().split(/\s+/)[0] || "cliente";
  return `Olá, ${firstName}! Sua OS #${input.orderId.slice(0, 8)} (${input.device}) foi atualizada para: ${ORDER_LABELS[input.status]}.`;
}

function configuredProvider() {
  const selected = provider();
  if (!selected || !whatsappConfigured())
    throw new AppError(
      "O envio por WhatsApp ainda não está configurado.",
      503,
      "WHATSAPP_NOT_CONFIGURED",
    );
  return selected;
}

function apiUrl(value: string) {
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    throw new AppError(
      "A URL do provedor de WhatsApp deve usar HTTPS.",
      503,
      "WHATSAPP_NOT_CONFIGURED",
    );
  return url.toString().replace(/\/$/, "");
}

export async function sendWhatsAppText(phone: string, message: string) {
  const selected = configuredProvider();
  const number = normalizeWhatsAppPhone(phone);
  let url: string;
  let headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: Record<string, string>;

  if (selected === "evolution") {
    url = `${apiUrl(process.env.EVOLUTION_API_URL!)}/message/sendText/${encodeURIComponent(process.env.EVOLUTION_INSTANCE!)}`;
    headers = { ...headers, apikey: process.env.EVOLUTION_API_KEY! };
    body = { number, text: message };
  } else {
    const baseUrl = apiUrl(process.env.ZAPI_API_URL || "https://api.z-api.io");
    url = `${baseUrl}/instances/${encodeURIComponent(process.env.ZAPI_INSTANCE_ID!)}/token/${encodeURIComponent(process.env.ZAPI_TOKEN!)}/send-text`;
    if (process.env.ZAPI_CLIENT_TOKEN)
      headers["Client-Token"] = process.env.ZAPI_CLIENT_TOKEN;
    body = { phone: number, message };
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error(`Provedor de WhatsApp recusou a mensagem (${response.status}).`);
    throw new AppError(
      "O provedor não confirmou o envio pelo WhatsApp.",
      502,
      "WHATSAPP_DELIVERY_FAILED",
    );
  }
}
