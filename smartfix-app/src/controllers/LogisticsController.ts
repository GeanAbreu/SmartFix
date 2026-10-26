import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ClientAddress } from "@/src/models";
import { AppError } from "@/src/errors/AppError";
import { actorFrom, accountById, isAdministrator } from "@/src/services/account.service";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";
import { listLocalOwnerAddresses, usesLocalAuthStore } from "@/src/services/local-auth.service";
import { createDelivery, deliveryWindow, parseLogisticsWebhook, quotePickup,
  verifyLogisticsWebhook, type LogisticsAddress } from "@/src/services/logistics.service";
import { nextWorkflowId, withWorkflow } from "@/src/services/workflow.service";
import { databaseId } from "@/src/validations/database-id";
import { completeOrder } from "@/src/services/order-policy.service";
import type { RepairOrder } from "@/src/types/workflow";

const dispatchInput = z.object({
  direction: z.enum(["pickup", "return"]),
  scheduledDate: z.iso.date().optional(),
  schedulePeriod: z.enum(["morning", "afternoon"]).optional(),
});

type AddressRecord = {
  id: string; cep: string; logradouro: string; numero: string; complemento?: string | null;
  bairro: string; cidade: string; estado: string; principal: boolean;
};

function ok(data: unknown, status = 200) {
  return noStoreResponse(NextResponse.json({ success: true, data }, { status }));
}

function displayAddress(address: AddressRecord) {
  return `${address.logradouro}, ${address.numero}${address.complemento ? ` — ${address.complemento}` : ""} · ${address.bairro}, ${address.cidade}/${address.estado} · CEP ${address.cep}`;
}

function providerAddress(address: AddressRecord): LogisticsAddress {
  return { streetAddress: `${address.logradouro}, ${address.numero}${address.complemento ? `, ${address.complemento}` : ""}, ${address.bairro}`,
    city: address.cidade, state: address.estado, postalCode: address.cep, country: "BR" };
}

async function addressFor(ownerId: string, role: "client" | "partner", requestedId?: string) {
  const addresses = usesLocalAuthStore()
    ? await listLocalOwnerAddresses(ownerId, role)
    : (await ClientAddress.findAll({ where: role === "client" ? { client_id: ownerId } : { partner_id: ownerId }, order: [["principal", "DESC"]] }))
      .map((row) => row.get({ plain: true }) as AddressRecord);
  const address = requestedId ? addresses.find((item) => item.id === requestedId) : addresses[0];
  if (!address) throw new AppError(`Cadastre um endereço ${role === "client" ? "do cliente" : "da assistência"} antes de solicitar a entrega.`, 422, "LOGISTICS_ADDRESS_REQUIRED");
  return address;
}

function orderFrom(data: Record<string, unknown>) { return data as unknown as RepairOrder; }

export class LogisticsController {
  static async incidents(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (!isAdministrator(actor.sub)) throw new AppError("Acesso administrativo necessário.", 403, "FORBIDDEN");
      const incidents = await withWorkflow((records) => records.filter((item) => item.kind === "order").flatMap((record) => {
        const order = orderFrom(record.data);
        return (["pickup", "return"] as const).flatMap((direction) => {
          const leg = order.serviceDetails.logistics?.[direction];
          if (!leg || !["failed", "reconciliation_required", "returned", "canceled", "cancelled"].includes(leg.status)) return [];
          return [{ orderId: order.id, device: order.device, clientId: order.clientId, partnerId: order.partnerId,
            direction, status: leg.status, error: leg.error, deliveryId: leg.deliveryId,
            trackingUrl: leg.trackingUrl, lastEventAt: leg.lastEventAt }];
        });
      }).sort((a, b) => (b.lastEventAt || "").localeCompare(a.lastEventAt || "")));
      return ok({ incidents });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }

  static async dispatch(request: NextRequest, id: string) {
    let direction: "pickup" | "return" | undefined;
    let createAttempted = false;
    try {
      databaseId.parse(id);
      const actor = await actorFrom(request);
      const input = dispatchInput.parse(await request.json());
      direction = input.direction;
      const prepared = await withWorkflow((records) => {
        const record = records.find((item) => item.kind === "order" && item.id === id);
        if (!record) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
        const order = orderFrom(record.data);
        const allowedActor = input.direction === "pickup"
          ? actor.role === "partner" && order.partnerId === actor.sub
          : actor.role === "client" && order.clientId === actor.sub;
        if (!allowedActor) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
        if (input.direction === "pickup" && (order.status !== "approved" || order.serviceDetails.paymentStatus !== "confirmed"))
          throw new AppError("A coleta só pode ser solicitada após a confirmação do pagamento.", 409, "INVALID_TRANSITION");
        if (input.direction === "return" && order.status !== "ready")
          throw new AppError("A entrega ao cliente só pode ser solicitada quando o reparo estiver pronto.", 409, "INVALID_TRANSITION");
        const existing = order.serviceDetails.logistics?.[input.direction];
        if (existing?.deliveryId) return { order, existing };
        if (["quoting", "creating", "reconciliation_required"].includes(existing?.status || ""))
          throw new AppError("Esta entrega já está sendo criada.", 409, "LOGISTICS_IN_PROGRESS");
        const scheduledDate = input.direction === "pickup" ? order.serviceDetails.scheduledDate : input.scheduledDate;
        const schedulePeriod = input.direction === "pickup" ? order.serviceDetails.schedulePeriod : input.schedulePeriod;
        if (!scheduledDate || !schedulePeriod)
          throw new AppError("Informe a data e o turno da entrega.", 422, "LOGISTICS_SCHEDULE_REQUIRED");
        order.serviceDetails.logistics ??= { provider: "uber_direct" };
        order.serviceDetails.logistics[input.direction] = {
          direction: input.direction, pickupAddress: "", dropoffAddress: "", status: "quoting",
          verification: "photo_and_pin", events: [], lastEventAt: new Date().toISOString(),
        };
        record.data = { ...order };
        return { order, scheduledDate, schedulePeriod };
      }, true);
      if ("existing" in prepared) return ok({ delivery: prepared.existing });

      const [clientAddress, partnerAddress, client, partner] = await Promise.all([
        addressFor(prepared.order.clientId, "client", prepared.order.serviceDetails.serviceAddressId),
        addressFor(prepared.order.partnerId, "partner"),
        accountById(prepared.order.clientId, "client"), accountById(prepared.order.partnerId, "partner"),
      ]);
      if (!client?.phone || !partner?.phone)
        throw new AppError("Cliente e assistência precisam ter telefone cadastrado.", 422, "LOGISTICS_PHONE_REQUIRED");
      const pickupOwner = direction === "pickup" ? client : partner;
      const dropoffOwner = direction === "pickup" ? partner : client;
      const pickupRecord = direction === "pickup" ? clientAddress : partnerAddress;
      const dropoffRecord = direction === "pickup" ? partnerAddress : clientAddress;
      const window = deliveryWindow(prepared.scheduledDate, prepared.schedulePeriod);
      const quote = await quotePickup(providerAddress(pickupRecord), providerAddress(dropoffRecord), window.readyAt, window.deadlineAt);
      await withWorkflow((records) => {
        const order = orderFrom(records.find((item) => item.kind === "order" && item.id === id)!.data);
        const leg = order.serviceDetails.logistics![direction! as "pickup" | "return"]!;
        Object.assign(leg, { quoteId: quote.id, quotedFeeCents: quote.feeCents, quoteExpiresAt: quote.expiresAt,
          pickupAddress: displayAddress(pickupRecord), dropoffAddress: displayAddress(dropoffRecord), status: "creating" });
      }, true);
      createAttempted = true;
      const delivery = await createDelivery({ direction, quoteId: quote.id, orderId: id, device: prepared.order.device,
        pickup: providerAddress(pickupRecord), dropoff: providerAddress(dropoffRecord),
        pickupContact: { name: pickupOwner.name, phone: pickupOwner.phone },
        dropoffContact: { name: dropoffOwner.name, phone: dropoffOwner.phone },
        pickupReadyAt: window.readyAt, pickupDeadlineAt: window.deadlineAt });
      const leg = await withWorkflow((records) => {
        const order = orderFrom(records.find((item) => item.kind === "order" && item.id === id)!.data);
        const current = order.serviceDetails.logistics![direction! as "pickup" | "return"]!;
        Object.assign(current, { deliveryId: delivery.id, status: delivery.status, trackingUrl: delivery.trackingUrl,
          lastEventAt: new Date().toISOString(), error: undefined });
        current.events.push({ id: `created:${delivery.id}`, status: delivery.status, at: current.lastEventAt! });
        return current;
      }, true);
      return ok({ delivery: leg }, 201);
    } catch (error) {
      if (direction) await withWorkflow((records) => {
        const record = records.find((item) => item.kind === "order" && item.id === id);
        if (!record) return;
        const leg = orderFrom(record.data).serviceDetails.logistics?.[direction!];
        if (leg && !leg.deliveryId) { leg.status = createAttempted ? "reconciliation_required" : "failed"; leg.error = createAttempted
          ? "A confirmação do provedor não foi recebida. Verifique o painel do Uber Direct antes de tentar novamente."
          : error instanceof Error ? error.message : "Falha ao criar entrega."; leg.lastEventAt = new Date().toISOString(); }
      }, true).catch(() => undefined);
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async webhook(request: NextRequest) {
    try {
      const rawBody = await request.text();
      if (!verifyLogisticsWebhook(rawBody, request.headers.get("x-uber-signature")))
        throw new AppError("Assinatura inválida.", 401, "INVALID_WEBHOOK");
      const event = parseLogisticsWebhook(rawBody);
      const match = /^smartfix-(\d+)-(pickup|return)$/.exec(event.externalId);
      if (!match) return ok({ received: true });
      await withWorkflow((records) => {
        const record = records.find((item) => item.kind === "order" && item.id === match[1]);
        if (!record) return;
        const leg = orderFrom(record.data).serviceDetails.logistics?.[match[2] as "pickup" | "return"];
        if (!leg || leg.deliveryId !== event.deliveryId || leg.events.some((item) => item.id === event.eventId)) return;
        leg.status = event.status; leg.lastEventAt = event.occurredAt;
        if (event.trackingUrl) leg.trackingUrl = event.trackingUrl;
        leg.events.push({ id: event.eventId, status: event.status, at: event.occurredAt });
        const order = orderFrom(record.data);
        if (["delivered", "completed"].includes(event.status)) {
          if (match[2] === "pickup" && order.status === "approved") {
            order.status = "in_progress";
            order.history.push({ status: "in_progress", at: event.occurredAt });
          } else if (match[2] === "return" && order.status === "ready") {
            completeOrder(order, event.occurredAt, "uber_direct");
          }
          const ownerId = match[2] === "pickup" ? order.clientId : order.partnerId;
          records.push({ id: nextWorkflowId(records), kind: "notification", ownerId,
            data: { message: match[2] === "pickup" ? `${order.device}: recebido pela assistência.` : `${order.device}: entregue ao cliente e O.S. concluída.`,
              href: ownerId === order.clientId ? "/cliente/ordens" : "/parceiro/ordens", read: false, createdAt: event.occurredAt } });
        }
      }, true);
      return ok({ received: true });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }
}
