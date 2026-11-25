import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/src/errors/AppError";
import { actorFrom } from "@/src/services/account.service";
import { nextWorkflowId, withWorkflow } from "@/src/services/workflow.service";
import { databaseId } from "@/src/validations/database-id";
import type { RepairOrder, WorkflowRecord } from "@/src/types/workflow";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

function orderFor(records: WorkflowRecord[], orderId: string, actor: { sub: string; role: string }) {
  const record = records.find((item) => item.kind === "order" && item.id === orderId);
  if (!record) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
  const order = record.data as unknown as RepairOrder;
  if ((actor.role === "client" ? order.clientId : order.partnerId) !== actor.sub) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
  if (order.serviceDetails.paymentStatus !== "confirmed") throw new AppError("O chat é liberado após a confirmação do pagamento.", 403, "CHAT_LOCKED");
  return order;
}

export class OrderChatController {
  static async list(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const actor = await actorFrom(request); const { id } = await params; databaseId.parse(id);
      const messages = await withWorkflow((records) => { orderFor(records, id, actor); return records.filter((item) => item.kind === "order_message" && item.data.orderId === id).sort((a, b) => String(a.data.createdAt).localeCompare(String(b.data.createdAt))); });
      return noStoreResponse(NextResponse.json({ success: true, data: { messages } }));
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }

  static async send(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const actor = await actorFrom(request); const { id } = await params; databaseId.parse(id);
      const { message } = z.object({ message: z.string().trim().min(1).max(2000) }).parse(await request.json());
      const created = await withWorkflow((records) => {
        const order = orderFor(records, id, actor); const now = new Date().toISOString();
        const record: WorkflowRecord = { id: nextWorkflowId(records), kind: "order_message", ownerId: actor.sub, data: { orderId: id, senderId: actor.sub, senderRole: actor.role, message, createdAt: now } };
        records.push(record);
        const recipient = actor.role === "client" ? order.partnerId : order.clientId;
        records.push({ id: nextWorkflowId(records), kind: "notification", ownerId: recipient, data: { message: `Nova mensagem na OS #${id}.`, href: actor.role === "client" ? "/parceiro/ordens" : "/cliente/ordens", read: false, createdAt: now } });
        return record;
      }, true);
      return noStoreResponse(NextResponse.json({ success: true, data: { message: created } }, { status: 201 }));
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }
}
