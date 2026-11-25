import { NextRequest, NextResponse } from "next/server";
import { cancelExpiredUnpaidOrders } from "@/src/services/order-expiration.service";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ success: false, message: "Não autorizado." }, { status: 401 });
  return NextResponse.json({ success: true, data: { cancelled: await cancelExpiredUnpaidOrders() } });
}
