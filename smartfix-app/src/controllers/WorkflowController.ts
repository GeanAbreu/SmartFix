import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ClientDevice, Partner, PartnerService, Review } from "@/src/models";
import { AppError } from "@/src/errors/AppError";
import {
  actorFrom,
  accountById,
  isAdministrator,
} from "@/src/services/account.service";
import {
  applyOrderAction,
  orderAction,
  orderInput,
  quoteTotal,
} from "@/src/services/order-policy.service";
import { nextWorkflowId, withWorkflow } from "@/src/services/workflow.service";
import { databaseId } from "@/src/validations/database-id";
import { emailConfigured, sendEmail } from "@/src/services/email.service";
import {
  orderStatusWhatsAppMessage,
  sendWhatsAppText,
  whatsappConfigured,
} from "@/src/services/whatsapp.service";
import {
  listLocalDevices,
  listLocalPartners,
  usesLocalAuthStore,
  verifyLocalPartner,
} from "@/src/services/local-auth.service";
import {
  ORDER_LABELS,
  type RepairOrder,
  type WorkflowRecord,
} from "@/src/types/workflow";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

function ok(data: unknown, status = 200) {
  return noStoreResponse(
    NextResponse.json({ success: true, data }, { status }),
  );
}
function failure(error: unknown) {
  return noStoreResponse(controllerErrorResponse(error));
}
function orderOf(record: WorkflowRecord) {
  const order = record.data as unknown as RepairOrder;
  order.serviceDetails = Object.assign({ estimatedDays: 3, warrantyDays: 90, deliveryFeeCents: 0,
    couponCode: "", discountCents: 0, scheduledDate: "", schedulePeriod: "" as const,
    serviceAddress: "", paymentMethod: "" as const, paymentStatus: "pending" as const, paidAt: "" },
  order.serviceDetails || {});
  order.quote = order.quote.map((item) => Object.assign({ category: "labor" as const, details: "" }, item));
  return order;
}
function notify(
  records: WorkflowRecord[],
  ownerId: string,
  message: string,
  href: string,
) {
  records.push({
    id: nextWorkflowId(records),
    kind: "notification",
    ownerId,
    data: { message, href, read: false, createdAt: new Date().toISOString() },
  });
}
async function partners() {
  if (usesLocalAuthStore()) return listLocalPartners();
  return (
    await Partner.findAll({
      attributes: [
        "id",
        "company_name",
        "full_name",
        "email",
        "cnpj",
        "is_verified",
      ],
    })
  ).map((partner) => ({
    id: partner.id,
    name: partner.company_name || partner.full_name,
    email: partner.email,
    document: partner.cnpj,
    isVerified: partner.is_verified,
  }));
}

export class WorkflowController {
  static async list(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      const orders = await withWorkflow((records) =>
        records
          .filter((record) => record.kind === "order")
          .map(orderOf)
          .filter((order) =>
            actor.role === "client"
              ? order.clientId === actor.sub
              : order.partnerId === actor.sub,
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
      const partnerNames = actor.role === "client"
        ? new Map((await partners()).map((partner) => [partner.id, partner.name]))
        : null;
      const clientAccounts = actor.role === "partner"
        ? new Map((await Promise.all([...new Set(orders.map((order) => order.clientId))].map(async (id) => [id, await accountById(id, "client")] as const))).map(([id, account]) => [id, account]))
        : null;
      return ok({
        orders: orders.map((order) => ({
          ...order,
          serviceDetails: actor.role === "client" ? { ...order.serviceDetails, internalNotes: "" } : order.serviceDetails,
          totalCents: quoteTotal(order.quote, order.serviceDetails.deliveryFeeCents, order.serviceDetails.discountCents),
          ...(partnerNames ? { partnerName: partnerNames.get(order.partnerId) || "Assistência parceira" } : {}),
          ...(clientAccounts ? { clientName: clientAccounts.get(order.clientId)?.name || "Cliente", clientEmail: clientAccounts.get(order.clientId)?.email || "", clientPhone: clientAccounts.get(order.clientId)?.phone || "" } : {}),
        })),
      });
    } catch (error) {
      return failure(error);
    }
  }
  static async create(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "client")
        throw new AppError(
          "Apenas clientes podem solicitar reparos.",
          403,
          "FORBIDDEN",
        );
      const input = orderInput.parse(await request.json());
      const partner = (await partners()).find(
        (item) => item.id === input.partnerId && item.isVerified,
      );
      if (!partner)
        throw new AppError(
          "Selecione uma assistência aprovada.",
          422,
          "INVALID_PARTNER",
        );
      const device = usesLocalAuthStore()
        ? (await listLocalDevices(actor.sub)).find(
            (item) => item.id === input.deviceId,
          )
        : await ClientDevice.findOne({
            where: { id: input.deviceId, client_id: actor.sub },
          });
      if (!device)
        throw new AppError("Dispositivo não encontrado.", 404, "NOT_FOUND");
      const now = new Date().toISOString();
      const order: RepairOrder = {
        ...input,
        id: "0",
        clientId: actor.sub,
        device: `${device.marca} ${device.modelo}`,
        status: "pending",
        quote: [],
        diagnosis: "",
        serviceDetails: { estimatedDays: 3, warrantyDays: 90, deliveryFeeCents: 0, couponCode: "", discountCents: 0,
          scheduledDate: "", schedulePeriod: "", serviceAddress: "", paymentMethod: "",
          paymentStatus: "pending", paidAt: "" },
        history: [{ status: "pending", at: now }],
        review: null,
        createdAt: now,
      };
      await withWorkflow((records) => {
        order.id = nextWorkflowId(records);
        records.push({
          id: order.id,
          kind: "order",
          ownerId: actor.sub,
          data: { ...order },
        });
        notify(
          records,
          input.partnerId,
          `Nova solicitação para ${order.device}.`,
          "/parceiro/ordens",
        );
      }, true);
      return ok({ order }, 201);
    } catch (error) {
      return failure(error);
    }
  }
  static async update(request: NextRequest, id: string) {
    try {
      databaseId.parse(id);
      const actor = await actorFrom(request);
      const input = orderAction.parse(await request.json());
      const result = await withWorkflow((records) => {
        const record = records.find(
          (item) => item.id === id && item.kind === "order",
        );
        if (!record)
          throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
        const previousStatus = orderOf(record).status;
        const updated = applyOrderAction(orderOf(record), actor, input);
        record.data = { ...updated };
        if (input.action !== "operations") {
          const ownerId =
            actor.role === "client" ? updated.partnerId : updated.clientId;
          notify(
            records,
            ownerId,
            `${updated.device}: ${input.action === "review" ? "avaliação recebida" : input.action === "request_cancellation" ? "cancelamento e reembolso solicitados" : ORDER_LABELS[updated.status]}.`,
            actor.role === "client" ? "/parceiro/ordens" : "/cliente/ordens",
          );
        }
        return { order: updated, statusChanged: previousStatus !== updated.status };
      }, true);
      const order = result.order;
      let whatsappStatus = "not_applicable";
      if (result.statusChanged) {
        whatsappStatus = "not_configured";
        if (whatsappConfigured()) {
          const client = await accountById(order.clientId, "client");
          if (!client?.phone) {
            whatsappStatus = "missing_phone";
          } else {
            try {
              await sendWhatsAppText(
                client.phone,
                orderStatusWhatsAppMessage({
                  clientName: client.name,
                  orderId: order.id,
                  device: order.device,
                  status: order.status,
                }),
              );
              whatsappStatus = "accepted";
            } catch (error) {
              console.error("Falha ao enviar atualização da OS por WhatsApp.", error);
              whatsappStatus = "failed";
            }
          }
        }
      }
      return ok({ order: { ...order, totalCents: quoteTotal(order.quote, order.serviceDetails.deliveryFeeCents, order.serviceDetails.discountCents) }, whatsappStatus });
    } catch (error) {
      return failure(error);
    }
  }
  static async partners(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      const admin = request.nextUrl.searchParams.get("admin") === "true";
      if (admin && !isAdministrator(actor.sub))
        throw new AppError(
          "Acesso administrativo necessário.",
          403,
          "FORBIDDEN",
        );
      const all = await partners();
      const approved = all.filter((partner) => partner.isVerified);
      const summaries = new Map<string, { rating: number | null; reviewCount: number; serviceCount: number; startingPriceCents: number | null; fastestDays: number | null }>();
      for (const partner of approved) summaries.set(partner.id, { rating: null, reviewCount: 0, serviceCount: 0, startingPriceCents: null, fastestDays: null });
      if (!admin) {
        if (usesLocalAuthStore()) {
          await withWorkflow((records) => {
            for (const partner of approved) {
              const services = records.filter((record) => record.kind === "service" && record.ownerId === partner.id && record.data.isActive !== false);
              const reviews = records.filter((record) => record.kind === "order" && (record.data as unknown as RepairOrder).partnerId === partner.id && (record.data as unknown as RepairOrder).review).map((record) => (record.data as unknown as RepairOrder).review!.rating);
              summaries.set(partner.id, { rating: reviews.length ? reviews.reduce((sum, value) => sum + value, 0) / reviews.length : null, reviewCount: reviews.length, serviceCount: services.length, startingPriceCents: services.length ? Math.min(...services.map((service) => Number(service.data.unitPriceCents))) : null, fastestDays: services.length ? Math.min(...services.map((service) => Number(service.data.estimatedDays))) : null });
            }
          });
        } else {
          const ids = approved.map((partner) => partner.id);
          const [services, reviews] = await Promise.all([
            PartnerService.findAll({ where: { partner_id: ids, is_active: true }, attributes: ["partner_id", "unit_price_cents", "estimated_days"] }),
            Review.findAll({ where: { partner_id: ids }, attributes: ["partner_id", "rating"] }),
          ]);
          for (const partner of approved) {
            const partnerServices = services.filter((service) => String(service.partner_id) === String(partner.id));
            const partnerReviews = reviews.filter((review) => String(review.partner_id) === String(partner.id));
            summaries.set(partner.id, { rating: partnerReviews.length ? partnerReviews.reduce((sum, review) => sum + review.rating, 0) / partnerReviews.length : null, reviewCount: partnerReviews.length, serviceCount: partnerServices.length, startingPriceCents: partnerServices.length ? Math.min(...partnerServices.map((service) => service.unit_price_cents)) : null, fastestDays: partnerServices.length ? Math.min(...partnerServices.map((service) => service.estimated_days)) : null });
          }
        }
      }
      return ok({
        partners: admin
          ? all
          : approved.map(({ id, name }) => ({ id, name, ...summaries.get(id) })),
      });
    } catch (error) {
      return failure(error);
    }
  }
  static async approvePartner(request: NextRequest, id: string) {
    try {
      databaseId.parse(id);
      const actor = await actorFrom(request);
      if (!isAdministrator(actor.sub))
        throw new AppError(
          "Acesso administrativo necessário.",
          403,
          "FORBIDDEN",
        );
      const input = z
        .object({
          verified: z.boolean(),
          reason: z.string().trim().max(1000).default(""),
        })
        .parse(await request.json());
      if (!input.verified && !input.reason)
        throw new AppError(
          "Informe o motivo da recusa.",
          422,
          "REASON_REQUIRED",
        );
      const partner = await accountById(id, "partner");
      if (!partner)
        throw new AppError("Parceiro não encontrado.", 404, "NOT_FOUND");
      const message = input.verified
        ? "Seu credenciamento foi aprovado."
        : `Credenciamento recusado: ${input.reason}`;
      let notificationId = "";
      const notification: WorkflowRecord = {
        id: "0",
        kind: "notification",
        ownerId: id,
        data: {
          message,
          href: "/parceiro/dashboard",
          read: false,
          actorId: actor.sub,
          createdAt: new Date().toISOString(),
        },
      };
      if (usesLocalAuthStore()) {
        notificationId = await withWorkflow((records) => nextWorkflowId(records));
        notification.id = notificationId;
        await verifyLocalPartner(id, input.verified, notification);
      }
      else
        await withWorkflow(async (records, transaction) => {
          notificationId = nextWorkflowId(records);
          notification.id = notificationId;
          await Partner.update(
            { is_verified: input.verified },
            { where: { id }, transaction },
          );
          records.push(notification);
        }, true);
      let emailStatus = "not_configured";
      if (emailConfigured()) {
        try {
          await sendEmail(
            partner.email,
            "Credenciamento SmartFix",
            message,
            notificationId,
          );
          emailStatus = "accepted";
        } catch {
          emailStatus = "failed";
        }
      }
      return ok({ verified: input.verified, emailStatus });
    } catch (error) {
      return failure(error);
    }
  }
  static async notifications(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      return ok({
        notifications: await withWorkflow((records) =>
          records
            .filter(
              (record) =>
                record.kind === "notification" && record.ownerId === actor.sub,
            )
            .reverse(),
        ),
      });
    } catch (error) {
      return failure(error);
    }
  }
  static async readNotification(request: NextRequest, id: string) {
    try {
      const actor = await actorFrom(request);
      await withWorkflow((records) => {
        const record = records.find(
          (item) =>
            item.kind === "notification" &&
            item.ownerId === actor.sub &&
            item.id === id,
        );
        if (!record)
          throw new AppError("Notificação não encontrada.", 404, "NOT_FOUND");
        record.data.read = true;
      }, true);
      return ok({});
    } catch (error) {
      return failure(error);
    }
  }
}
