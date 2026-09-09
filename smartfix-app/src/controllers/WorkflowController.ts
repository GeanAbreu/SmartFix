import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ClientDevice, Partner } from "@/src/models";
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
  quoteItemInput,
  quoteTotal,
} from "@/src/services/order-policy.service";
import { withWorkflow } from "@/src/services/workflow.service";
import { emailConfigured, sendEmail } from "@/src/services/email.service";
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
  return record.data as unknown as RepairOrder;
}
function notify(
  records: WorkflowRecord[],
  ownerId: string,
  message: string,
  href: string,
) {
  records.push({
    id: randomUUID(),
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
      return ok({
        orders: orders.map((order) => ({
          ...order,
          totalCents: quoteTotal(order.quote),
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
        id: randomUUID(),
        clientId: actor.sub,
        device: `${device.marca} ${device.modelo}`,
        status: "pending",
        quote: [],
        diagnosis: "",
        history: [{ status: "pending", at: now }],
        review: null,
        createdAt: now,
      };
      await withWorkflow((records) => {
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
      z.uuid().parse(id);
      const actor = await actorFrom(request);
      const input = orderAction.parse(await request.json());
      const order = await withWorkflow((records) => {
        const record = records.find(
          (item) => item.id === id && item.kind === "order",
        );
        if (!record)
          throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
        const updated = applyOrderAction(orderOf(record), actor, input);
        record.data = { ...updated };
        const ownerId =
          actor.role === "client" ? updated.partnerId : updated.clientId;
        notify(
          records,
          ownerId,
          `${updated.device}: ${input.action === "review" ? "avaliação recebida" : ORDER_LABELS[updated.status]}.`,
          actor.role === "client" ? "/parceiro/ordens" : "/cliente/ordens",
        );
        return updated;
      }, true);
      return ok({ order: { ...order, totalCents: quoteTotal(order.quote) } });
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
      return ok({
        partners: admin
          ? all
          : all
              .filter((partner) => partner.isVerified)
              .map(({ id, name }) => ({ id, name })),
      });
    } catch (error) {
      return failure(error);
    }
  }
  static async approvePartner(request: NextRequest, id: string) {
    try {
      z.uuid().parse(id);
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
      const notificationId = randomUUID();
      const notification: WorkflowRecord = {
        id: notificationId,
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
      if (usesLocalAuthStore())
        await verifyLocalPartner(id, input.verified, notification);
      else
        await withWorkflow(async (records, transaction) => {
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
  static async services(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "partner")
        throw new AppError("Área exclusiva de parceiros.", 403, "FORBIDDEN");
      if (request.method === "POST") {
        const input = quoteItemInput
          .omit({ quantity: true })
          .extend({
            description: z.string().trim().max(2000).default(""),
            estimatedDays: z.number().int().min(0).max(365),
          })
          .parse(await request.json());
        await withWorkflow((records) => {
          records.push({
            id: randomUUID(),
            kind: "service",
            ownerId: actor.sub,
            data: input,
          });
        }, true);
      }
      return ok({
        services: await withWorkflow((records) =>
          records.filter(
            (record) =>
              record.kind === "service" && record.ownerId === actor.sub,
          ),
        ),
      });
    } catch (error) {
      return failure(error);
    }
  }
}
