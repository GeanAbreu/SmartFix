import { NextRequest, NextResponse } from "next/server";
import { QueryTypes } from "sequelize";
import { z } from "zod";
import sequelize, { assertDatabaseConfigured } from "@/src/config/database";
import { actorFrom, isAdministrator } from "@/src/services/account.service";
import { AppError } from "@/src/errors/AppError";
import { controllerErrorResponse, noStoreResponse } from "@/src/controllers/controller.utils";

export const runtime = "nodejs";

type Context = { params: Promise<{ clientId: string }> };
const schema = z.object({ body: z.string().trim().min(1).max(2000) });

export async function GET(request: NextRequest, context: Context) {
  try {
    const actor = await actorFrom(request);
    if (!isAdministrator(actor.sub)) throw new AppError("Acesso não autorizado.", 403, "FORBIDDEN");
    assertDatabaseConfigured();
    const clientId = z.uuid().parse((await context.params).clientId);
    const messages = await sequelize.query<{
      id: string; senderRole: "client" | "admin"; body: string; createdAt: string;
    }>(`SELECT id, sender_role AS "senderRole", body, created_at AS "createdAt"
        FROM public.support_messages WHERE client_id = $1 AND partner_id IS NULL
        ORDER BY created_at ASC, id ASC LIMIT 500`,
      { bind: [clientId], type: QueryTypes.SELECT });
    return noStoreResponse(NextResponse.json({ success: true, data: { messages } }));
  } catch (error) { return controllerErrorResponse(error); }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const actor = await actorFrom(request);
    if (!isAdministrator(actor.sub)) throw new AppError("Acesso não autorizado.", 403, "FORBIDDEN");
    assertDatabaseConfigured();
    const clientId = z.uuid().parse((await context.params).clientId);
    const { body } = schema.parse(await request.json());
    const [message] = await sequelize.query<{
      id: string; senderRole: "admin"; body: string; createdAt: string;
    }>(`INSERT INTO public.support_messages (client_id, recipient_role, sender_role, sender_id, body)
        VALUES ($1, 'smartfix', 'admin', $2, $3)
        RETURNING id, sender_role AS "senderRole", body, created_at AS "createdAt"`,
      { bind: [clientId, actor.sub, body], type: QueryTypes.SELECT });
    return noStoreResponse(NextResponse.json({ success: true, data: { message } }, { status: 201 }));
  } catch (error) { return controllerErrorResponse(error); }
}
