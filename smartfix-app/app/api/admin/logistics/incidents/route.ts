import type { NextRequest } from "next/server";
import { LogisticsController } from "@/src/controllers/LogisticsController";

export const runtime = "nodejs";
export const GET = (request: NextRequest) => LogisticsController.incidents(request);
