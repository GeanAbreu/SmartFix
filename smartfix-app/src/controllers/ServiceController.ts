import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/src/errors/AppError";
import { Partner, PartnerService } from "@/src/models";
import { actorFrom } from "@/src/services/account.service";
import { withWorkflow } from "@/src/services/workflow.service";
import { usesLocalAuthStore } from "@/src/services/local-auth.service";
import { assertDatabaseConfigured } from "@/src/config/database";
import type { WorkflowRecord } from "@/src/types/workflow";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

const input = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(2000).default(""),
  unitPriceCents: z.number().int().min(0).max(10_000_000),
  estimatedDays: z.number().int().min(0).max(365),
  isActive: z.boolean().default(true),
});
type ServiceInput = z.infer<typeof input>;

const ok = (data: unknown, status = 200) => noStoreResponse(NextResponse.json({ success: true, data }, { status }));
const failure = (error: unknown) => noStoreResponse(controllerErrorResponse(error));

function fromModel(service: PartnerService) {
  return { id: service.id, partnerId: service.partner_id, name: service.name,
    description: service.description, unitPriceCents: service.unit_price_cents,
    estimatedDays: service.estimated_days, isActive: service.is_active };
}

function fromRecord(record: WorkflowRecord) {
  const data = record.data as ServiceInput;
  return { id: record.id, partnerId: record.ownerId, name: data.name,
    description: data.description || "", unitPriceCents: data.unitPriceCents,
    estimatedDays: data.estimatedDays, isActive: data.isActive !== false };
}

async function partnerId(request: NextRequest) {
  const actor = await actorFrom(request);
  if (actor.role !== "partner") throw new AppError("Área exclusiva de parceiros.", 403, "FORBIDDEN");
  return actor.sub;
}

async function listServices(id: string, activeOnly = false) {
  if (usesLocalAuthStore()) return withWorkflow((records) => records
    .filter((record) => record.kind === "service" && record.ownerId === id)
    .map(fromRecord).filter((service) => !activeOnly || service.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
  assertDatabaseConfigured();
  const services = await PartnerService.findAll({ where: { partner_id: id, ...(activeOnly ? { is_active: true } : {}) }, order: [["name", "ASC"]] });
  return services.map(fromModel);
}

export class ServiceController {
  static async list(request: NextRequest) {
    try { return ok({ services: await listServices(await partnerId(request)) }); }
    catch (error) { return failure(error); }
  }

  static async create(request: NextRequest) {
    try {
      const id = await partnerId(request);
      const values = input.parse(await request.json());
      if (usesLocalAuthStore()) await withWorkflow((records) => {
        records.push({ id: randomUUID(), kind: "service", ownerId: id, data: values });
      }, true);
      else {
        assertDatabaseConfigured();
        await PartnerService.create({ partner_id: id, name: values.name, description: values.description,
          unit_price_cents: values.unitPriceCents, estimated_days: values.estimatedDays, is_active: values.isActive });
      }
      return ok({ services: await listServices(id) }, 201);
    } catch (error) { return failure(error); }
  }

  static async update(request: NextRequest, serviceId: string) {
    try {
      z.uuid().parse(serviceId);
      const id = await partnerId(request);
      const values = input.partial().refine((value) => Object.keys(value).length > 0).parse(await request.json());
      if (usesLocalAuthStore()) await withWorkflow((records) => {
        const record = records.find((item) => item.kind === "service" && item.ownerId === id && item.id === serviceId);
        if (!record) throw new AppError("Serviço não encontrado.", 404, "NOT_FOUND");
        record.data = { ...record.data, ...values };
      }, true);
      else {
        assertDatabaseConfigured();
        const service = await PartnerService.findOne({ where: { id: serviceId, partner_id: id } });
        if (!service) throw new AppError("Serviço não encontrado.", 404, "NOT_FOUND");
        await service.update({ ...(values.name !== undefined ? { name: values.name } : {}),
          ...(values.description !== undefined ? { description: values.description } : {}),
          ...(values.unitPriceCents !== undefined ? { unit_price_cents: values.unitPriceCents } : {}),
          ...(values.estimatedDays !== undefined ? { estimated_days: values.estimatedDays } : {}),
          ...(values.isActive !== undefined ? { is_active: values.isActive } : {}) });
      }
      return ok({ services: await listServices(id) });
    } catch (error) { return failure(error); }
  }

  static async publicList(request: NextRequest, id: string) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "client") throw new AppError("Área exclusiva de clientes.", 403, "FORBIDDEN");
      z.uuid().parse(id);
      if (usesLocalAuthStore()) {
        const { listLocalPartners } = await import("@/src/services/local-auth.service");
        if (!(await listLocalPartners()).some((partner) => partner.id === id && partner.isVerified))
          throw new AppError("Assistência não encontrada.", 404, "NOT_FOUND");
      } else {
        assertDatabaseConfigured();
        if (!await Partner.findOne({ where: { id, is_verified: true }, attributes: ["id"] }))
          throw new AppError("Assistência não encontrada.", 404, "NOT_FOUND");
      }
      return ok({ services: await listServices(id, true) });
    } catch (error) { return failure(error); }
  }
}
