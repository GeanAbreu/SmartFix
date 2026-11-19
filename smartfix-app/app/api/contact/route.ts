import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { controllerErrorResponse, noStoreResponse } from "@/src/controllers/controller.utils";
import { sendEmail } from "@/src/services/email.service";
import { withRateLimit } from "@/src/services/rate-limit.service";
import { contactSchema } from "@/src/validations/contact.validation";

export const runtime = "nodejs";

async function submitContact(request: NextRequest) {
  try {
    const contact = contactSchema.parse(await request.json());

    // Campo invisível preenchido apenas por bots. A resposta neutra evita ensinar
    // ao remetente automatizado como contornar a proteção.
    if (contact.website) {
      return noStoreResponse(NextResponse.json({ success: true, data: null }));
    }

    const recipient = process.env.SUPPORT_EMAIL?.trim() || "contato@smartfix.com.br";
    const body = [
      contact.message,
      "",
      "--- Dados para retorno ---",
      `Nome: ${contact.name}`,
      `E-mail: ${contact.email}`,
      `Telefone: ${contact.phone || "Não informado"}`,
    ].join("\n");

    await sendEmail(
      recipient,
      `[Contato SmartFix] ${contact.subject}`,
      body,
      `contact/${randomUUID()}`,
    );

    return noStoreResponse(NextResponse.json({ success: true, data: null }));
  } catch (error) {
    return noStoreResponse(controllerErrorResponse(error));
  }
}

export function POST(request: NextRequest) {
  return withRateLimit(request, "public:contact", 5, 15 * 60_000, submitContact);
}
