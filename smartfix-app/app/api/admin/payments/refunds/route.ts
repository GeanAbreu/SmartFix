import type { NextRequest } from "next/server";
import { PaymentController } from "@/src/controllers/PaymentController";

export const runtime = "nodejs";
export const GET = (request: NextRequest) => PaymentController.refundRequests(request);
