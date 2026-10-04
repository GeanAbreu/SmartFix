import { AuthController } from "@/src/controllers/AuthController";

export const runtime = "nodejs";
export const GET = AuthController.session;
