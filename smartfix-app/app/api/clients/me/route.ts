import { ClientController } from "@/src/controllers/ClientController";

export const runtime = "nodejs";
export const GET = ClientController.me;
export const PATCH = ClientController.update;
