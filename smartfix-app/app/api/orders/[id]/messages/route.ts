import { OrderChatController } from "@/src/controllers/OrderChatController";
export const runtime = "nodejs";
export const GET = OrderChatController.list;
export const POST = OrderChatController.send;
