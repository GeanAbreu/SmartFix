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
      clientId: string; clientName: string; lastMessageAt: string | null; lastMessage: string | null;
    }>(`SELECT DISTINCT ON (o.client_id)
          o.client_id::text AS "clientId",
          COALESCE(NULLIF(BTRIM(c.full_name), ''), 'Cliente SmartFix') AS "clientName",
          m.created_at AS "lastMessageAt", m.body AS "lastMessage"
        FROM public.repair_orders o
        JOIN public.clients c ON c.id = o.client_id
        LEFT JOIN LATERAL (
          SELECT created_at, body FROM public.support_messages
          WHERE client_id = o.client_id AND partner_id = o.partner_id
          ORDER BY created_at DESC, id DESC LIMIT 1
        ) m ON true
        WHERE o.partner_id = $1
        ORDER BY o.client_id, m.created_at DESC NULLS LAST`,
      { bind: [actor.sub], type: QueryTypes.SELECT });
    conversations.sort((a, b) => (b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0) - (a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0));
    return noStoreResponse(NextResponse.json({ success: true, data: { conversations } }));
  } catch (error) { return controllerErrorResponse(error); }
}
