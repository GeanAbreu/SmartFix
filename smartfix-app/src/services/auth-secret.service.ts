import { createHmac, randomBytes } from "node:crypto";
import { AppError } from "@/src/errors/AppError";

const globalForAuthSecret = globalThis as unknown as {
  smartfixDevelopmentAuthSecret?: string;
};

export function getAuthSecret() {
  const configured = process.env.SESSION_SECRET;

  if (configured && configured.length >= 32) {
    return configured;
  }

  // Projetos conectados ao Supabase pela Vercel já recebem este segredo no
  // servidor. Derivamos uma chave separada para não reutilizar diretamente a
  // chave JWT do provedor como chave de sessão da aplicação.
  const supabaseSecret = process.env.SUPABASE_JWT_SECRET;
  if (supabaseSecret && supabaseSecret.length >= 32) {
    return createHmac("sha256", supabaseSecret)
      .update("smartfix:authentication:v1")
      .digest("hex");
  }

  if (process.env.NODE_ENV === "development") {
    globalForAuthSecret.smartfixDevelopmentAuthSecret ??=
      randomBytes(48).toString("hex");
    return globalForAuthSecret.smartfixDevelopmentAuthSecret;
  }

  throw new AppError(
    "O serviço de autenticação não está configurado neste ambiente.",
    503,
    "SESSION_NOT_CONFIGURED",
  );
}
