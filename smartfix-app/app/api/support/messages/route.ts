import { NextRequest, NextResponse } from "next/server";
import { QueryTypes } from "sequelize";
import { z } from "zod";
import sequelize, { assertDatabaseConfigured } from "@/src/config/database";
import { actorFrom } from "@/src/services/account.service";
import { AppError } from "@/src/errors/AppError";
import { controllerErrorResponse, noStoreResponse } from "@/src/controllers/controller.utils";

export const runtime = "nodejs";

const messageSchema = z.object({ body: z.string().trim().min(1, "Digite uma mensagem.").max(2000), partnerId: z.uuid().nullable().default(null) });

async function authorizedPartner(clientId: string, partnerId: string) {
  const [row] = await sequelize.query<{ id: string }>(
    `SELECT p.id FROM public.partner p JOIN public.repair_orders o ON o.partner_id = p.id
     WHERE o.client_id = $1 AND p.id = $2 LIMIT 1`,
    { bind: [clientId, partnerId], type: QueryTypes.SELECT });
  if (!row) throw new AppError("Assistência não vinculada a um reparo seu.", 403, "FORBIDDEN");
}

export async function GET(request: NextRequest) {
  try {
    const actor = await actorFrom(request);
    if (actor.role !== "client") throw new AppError("Acesso não autorizado.", 403, "FORBIDDEN");
    assertDatabaseConfigured();
    const rawPartnerId = request.nextUrl.searchParams.get("partnerId");
    const partnerId = rawPartnerId ? z.uuid().parse(rawPartnerId) : null;
    if (partnerId) await authorizedPartner(actor.sub, partnerId);
    const messages = await sequelize.query<{
      id: string; senderRole: "client" | "admin"; body: string; createdAt: string;
    }>(`SELECT id, sender_role AS "senderRole", body, created_at AS "createdAt"
        FROM public.support_messages WHERE client_id = $1 AND partner_id IS NOT DISTINCT FROM $2
        ORDER BY created_at ASC, id ASC LIMIT 500`,
      { bind: [actor.sub, partnerId], type: QueryTypes.SELECT });
    return noStoreResponse(NextResponse.json({ success: true, data: { messages } }));
  } catch (error) { return controllerErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await actorFrom(request);
    if (actor.role !== "client") throw new AppError("Acesso não autorizado.", 403, "FORBIDDEN");
    assertDatabaseConfigured();
    const { body, partnerId } = messageSchema.parse(await request.json());
    if (partnerId) await authorizedPartner(actor.sub, partnerId);
    const [message] = await sequelize.query<{
      id: string; senderRole: "client"; body: string; createdAt: string;
    }>(`INSERT INTO public.support_messages (client_id, recipient_role, partner_id, sender_role, sender_id, body)
        VALUES ($1, $2, $3, 'client', $1, $4)
        RETURNING id, sender_role AS "senderRole", body, created_at AS "createdAt"`,
      { bind: [actor.sub, partnerId ? "partner" : "smartfix", partnerId, body], type: QueryTypes.SELECT });
    return noStoreResponse(NextResponse.json({ success: true, data: { message } }, { status: 201 }));
  } catch (error) { return controllerErrorResponse(error); }
}
