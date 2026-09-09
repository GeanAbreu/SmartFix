import "server-only";
import { AppError } from "@/src/errors/AppError";

export function emailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY && process.env.MAIL_FROM && process.env.APP_URL,
  );
}
export function applicationUrl() {
  if (!process.env.APP_URL)
    throw new AppError(
      "Configure APP_URL para habilitar este serviço.",
      503,
      "NOT_CONFIGURED",
    );
  const url = new URL(process.env.APP_URL);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    throw new AppError("APP_URL deve usar HTTPS.", 503, "NOT_CONFIGURED");
  return url.origin;
}
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  idempotencyKey: string,
) {
  if (!emailConfigured())
    throw new AppError(
      "O envio de e-mail ainda não está configurado.",
      503,
      "MAIL_NOT_CONFIGURED",
    );
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: [to],
      subject,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok)
    throw new AppError(
      "O provedor não confirmou o envio do e-mail.",
      502,
      "MAIL_DELIVERY_FAILED",
    );
}
