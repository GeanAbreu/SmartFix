import { DatabaseController } from "@/src/controllers/DatabaseController";

export const runtime = "nodejs";
export const GET = DatabaseController.health;
