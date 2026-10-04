import { WorkflowController } from "@/src/controllers/WorkflowController";
export const runtime = "nodejs";
export const GET = WorkflowController.list;
export const POST = WorkflowController.create;
