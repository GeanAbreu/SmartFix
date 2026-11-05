import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

type Check = { name: string; variables: string[]; optional?: boolean };

const checks: Check[] = [
  { name: "Aplicação", variables: ["APP_URL", "SESSION_SECRET"] },
  { name: "PostgreSQL", variables: ["DATABASE_URL"] },
  { name: "Supabase Realtime", variables: ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"], optional: true },
  { name: "Resend", variables: ["RESEND_API_KEY", "MAIL_FROM"], optional: true },
  { name: "Mercado Pago", variables: ["MERCADO_PAGO_ACCESS_TOKEN", "MERCADO_PAGO_WEBHOOK_SECRET", "PAYMENT_PUBLIC_URL"], optional: true },
  { name: "Uber Direct", variables: ["UBER_DIRECT_CLIENT_ID", "UBER_DIRECT_CLIENT_SECRET", "UBER_DIRECT_CUSTOMER_ID", "UBER_DIRECT_WEBHOOK_SECRET"], optional: true },
  { name: "Google OAuth", variables: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"], optional: true },
];

function configured(variable: string) {
  return Boolean(process.env[variable]?.trim());
}

function validUrl(variable: string, httpsRequired = false) {
  const value = process.env[variable]?.trim();
  if (!value) return;
  const url = new URL(value);
  if (httpsRequired && url.protocol !== "https:")
    throw new Error(`${variable} deve usar HTTPS.`);
}

function configurationCheck() {
  const errors: string[] = [];
  for (const check of checks) {
    const present = check.variables.filter(configured);
    if (present.length === 0 && check.optional) {
      console.log(`○ ${check.name}: desabilitado`);
      continue;
    }
    const missing = check.variables.filter((variable) => !configured(variable));
    if (missing.length) {
      errors.push(`${check.name}: faltam ${missing.join(", ")}`);
      console.log(`✗ ${check.name}: configuração incompleta`);
    } else console.log(`✓ ${check.name}: configurado`);
  }

  const whatsapp = process.env.WHATSAPP_PROVIDER?.trim().toLowerCase();
  const whatsappVariables = whatsapp === "evolution"
    ? ["EVOLUTION_API_URL", "EVOLUTION_API_KEY", "EVOLUTION_INSTANCE"]
    : whatsapp === "zapi" ? ["ZAPI_INSTANCE_ID", "ZAPI_TOKEN"] : [];
  if (!whatsapp) console.log("○ WhatsApp: desabilitado");
  else if (!(["evolution", "zapi"].includes(whatsapp))) errors.push("WhatsApp: WHATSAPP_PROVIDER deve ser evolution ou zapi");
  else {
    const missing = whatsappVariables.filter((variable) => !configured(variable));
    if (missing.length) errors.push(`WhatsApp: faltam ${missing.join(", ")}`);
    console.log(missing.length ? "✗ WhatsApp: configuração incompleta" : `✓ WhatsApp (${whatsapp}): configurado`);
  }

  try {
    validUrl("APP_URL", process.env.NODE_ENV === "production");
    validUrl("SUPABASE_URL", true);
    validUrl("PAYMENT_PUBLIC_URL", true);
    validUrl("EVOLUTION_API_URL", process.env.NODE_ENV === "production");
    validUrl("PHOTON_API_URL", true);
    if ((process.env.SESSION_SECRET?.length || 0) < 32) errors.push("SESSION_SECRET deve ter ao menos 32 caracteres.");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "URL inválida.");
  }
  if (errors.length) throw new Error(errors.join("\n"));
}

async function providerRequest(name: string, request: () => Promise<Response>) {
  const response = await request();
  if (!response.ok) throw new Error(`${name} respondeu HTTP ${response.status}.`);
  console.log(`✓ ${name}: credencial aceita`);
}

async function liveSmoke() {
  const tasks: Promise<void>[] = [];
  if (configured("MERCADO_PAGO_ACCESS_TOKEN")) tasks.push(providerRequest("Mercado Pago", () => fetch(
    "https://api.mercadopago.com/users/me",
    { headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }, signal: AbortSignal.timeout(12_000) },
  )));
  if (configured("RESEND_API_KEY")) tasks.push((async () => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(12_000),
    });
    // A sending-only key cannot list domains. An intentionally incomplete send
    // validates authentication without creating or delivering an email.
    if (response.status !== 422) throw new Error(`Resend respondeu HTTP ${response.status}.`);
    console.log("✓ Resend: credencial de envio aceita");
  })());
  if (configured("SUPABASE_URL") && configured("SUPABASE_PUBLISHABLE_KEY")) tasks.push(providerRequest("Supabase", () => fetch(
    `${process.env.SUPABASE_URL!.replace(/\/$/, "")}/auth/v1/settings`,
    { headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_PUBLISHABLE_KEY}` }, signal: AbortSignal.timeout(12_000) },
  )));
  if (configured("UBER_DIRECT_CLIENT_ID")) {
    const body = new URLSearchParams({ client_id: process.env.UBER_DIRECT_CLIENT_ID!, client_secret: process.env.UBER_DIRECT_CLIENT_SECRET!, grant_type: "client_credentials", scope: "eats.deliveries" });
    tasks.push(providerRequest("Uber Direct", () => fetch(process.env.UBER_DIRECT_AUTH_URL || "https://auth.uber.com/oauth/v2/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, signal: AbortSignal.timeout(12_000),
    })));
  }
  if (configured("PHOTON_API_URL")) {
    const url = new URL(process.env.PHOTON_API_URL!);
    url.searchParams.set("q", "São Paulo, Brasil");
    url.searchParams.set("limit", "1");
    tasks.push(providerRequest("Photon", () => fetch(url, { signal: AbortSignal.timeout(12_000) })));
  }
  if (!tasks.length) console.log("Nenhuma integração externa configurada para smoke test.");
  const results = await Promise.allSettled(tasks);
  const failures = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason instanceof Error ? result.reason.message : "Integração indisponível.");
  if (failures.length) throw new Error(failures.join("\n"));
  console.log("Smoke test somente leitura concluído; nenhuma mensagem, cobrança ou entrega foi criada.");
}

async function main() {
  configurationCheck();
  if (process.argv.includes("--live")) await liveSmoke();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falha na validação das integrações.");
  process.exitCode = 1;
});
