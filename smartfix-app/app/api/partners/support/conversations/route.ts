import { NextRequest, NextResponse } from "next/server";
import { QueryTypes } from "sequelize";
import sequelize, { assertDatabaseConfigured } from "@/src/config/database";
import { actorFrom } from "@/src/services/account.service";
import { AppError } from "@/src/errors/AppError";
import { controllerErrorResponse, noStoreResponse } from "@/src/controllers/controller.utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const actor = await actorFrom(request);
    if (actor.role !== "partner") throw new AppError("Acesso não autorizado.", 403, "FORBIDDEN");
    assertDatabaseConfigured();
    const conversations = await sequelize.query<{
      clientId: string; clientName: string; lastMessageAt: string; lastMessage: string;
    }>(`SELECT DISTINCT ON (m.client_id)
          m.client_id AS "clientId", c.nome AS "clientName",
          m.created_at AS "lastMessageAt", m.body AS "lastMessage"
        FROM public.support_messages m JOIN public.clients c ON c.id = m.client_id
        WHERE m.partner_id = $1
        ORDER BY m.client_id, m.created_at DESC, m.id DESC`,
      { bind: [actor.sub], type: QueryTypes.SELECT });
    conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    return noStoreResponse(NextResponse.json({ success: true, data: { conversations } }));
  } catch (error) { return controllerErrorResponse(error); }
}
