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
    if (actor.role !== "client") throw new AppError("Acesso não autorizado.", 403, "FORBIDDEN");
    assertDatabaseConfigured();
    const partners = await sequelize.query<{ id: string; name: string }>(
      `SELECT DISTINCT p.id, p.full_name AS name FROM public.repair_orders o
       JOIN public.partner p ON p.id = o.partner_id WHERE o.client_id = $1
       ORDER BY name`,
      { bind: [actor.sub], type: QueryTypes.SELECT });
    return noStoreResponse(NextResponse.json({ success: true, data: { partners } }));
  } catch (error) { return controllerErrorResponse(error); }
}
