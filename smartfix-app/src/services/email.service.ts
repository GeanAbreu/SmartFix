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
  html?: string,
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
      ...(html ? { html } : {}),
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

export function recoveryCodeEmail(code: string) {
  const text = `Seu código de recuperação SmartFix é: ${code}\n\nEle é válido por 15 minutos e pode ser usado apenas uma vez.\n\nSe você não solicitou a alteração, ignore este e-mail.`;
  const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recuperação de senha SmartFix</title></head>
<body style="margin:0;padding:0;background:#eef3f8;font-family:Arial,Helvetica,sans-serif;color:#10233c">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3f8;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 35px rgba(8,35,64,.10)">
        <tr><td style="padding:28px 36px;background:#06172b;border-bottom:4px solid #ff6b17">
          <div style="font-size:25px;line-height:1;font-weight:800;letter-spacing:.04em;color:#ffffff">SMART<span style="color:#ff6b17">FIX</span></div>
        </td></tr>
        <tr><td style="padding:38px 36px 18px">
          <div style="font-size:12px;font-weight:700;letter-spacing:.12em;color:#f26522">RECUPERAÇÃO DE SENHA</div>
          <h1 style="margin:12px 0 14px;font-size:28px;line-height:1.2;color:#07182c">Seu código de acesso</h1>
          <p style="margin:0;color:#536579;font-size:16px;line-height:1.65">Recebemos uma solicitação para redefinir a senha da sua conta SmartFix. Use o código abaixo para continuar:</p>
        </td></tr>
        <tr><td align="center" style="padding:14px 36px 24px">
          <div style="display:inline-block;padding:18px 28px;border:1px solid #ffd3ba;border-radius:12px;background:#fff7f2;color:#e85100;font-family:'Courier New',monospace;font-size:34px;line-height:1;font-weight:800;letter-spacing:9px">${code}</div>
        </td></tr>
        <tr><td style="padding:0 36px 38px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:10px;background:#f3f7fb"><tr><td style="padding:16px 18px;color:#536579;font-size:14px;line-height:1.55"><strong style="color:#10233c">⏱ Válido por 15 minutos.</strong><br>O código é de uso único. Nunca compartilhe este código com outras pessoas.</td></tr></table>
          <p style="margin:24px 0 0;color:#78889a;font-size:13px;line-height:1.55">Se você não solicitou esta alteração, pode ignorar este e-mail com segurança. Sua senha continuará a mesma.</p>
        </td></tr>
        <tr><td style="padding:20px 36px;background:#f7f9fc;color:#8a98a8;font-size:12px;line-height:1.5;text-align:center">SmartFix · Conectando pessoas a soluções com tecnologia e confiança.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { text, html };
}
