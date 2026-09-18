import { ServiceController } from "@/src/controllers/ServiceController";
export const runtime = "nodejs";
export const GET = ServiceController.list;
export const POST = ServiceController.create;
