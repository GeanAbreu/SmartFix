import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { QueryTypes } from "sequelize";
import sequelize from "@/src/config/database";
import { actorFrom } from "@/src/services/account.service";
import { controllerErrorResponse, noStoreResponse } from "@/src/controllers/controller.utils";
import { AppError } from "@/src/errors/AppError";
import {
  adminAdmins, adminAudit, adminDashboard, adminFinance, adminOrders, adminPartners,
  adminReviews, adminUsers, permissionsForAdminRole, requireAdministrator, writeAdminAudit,
  type AdminSection,
} from "@/src/services/admin.service";

export const dynamic = "force-dynamic";
const ok = (data: unknown) => noStoreResponse(NextResponse.json({ success: true, data }));

export async function GET(request: NextRequest, context: { params: Promise<{ section: string }> }) {
  try {
    const actor = await actorFrom(request);
    const access = await requireAdministrator(actor);
    const { section } = await context.params;
    const loaders: Record<string, () => Promise<unknown>> = {
      dashboard: adminDashboard,
      users: () => adminUsers(request.nextUrl.searchParams),
      partners: () => adminPartners(request.nextUrl.searchParams),
      orders: () => adminOrders(request.nextUrl.searchParams),
      reviews: () => adminReviews(request.nextUrl.searchParams),
      finance: () => adminFinance(request.nextUrl.searchParams),
      admins: async () => ({ items: await adminAdmins() }),
      audit: () => adminAudit(request.nextUrl.searchParams),
    };
    if (!loaders[section]) throw new AppError("Seção administrativa inexistente.", 404, "NOT_FOUND");
    if (!access.permissions.includes(section as AdminSection)) throw new AppError("Seu papel não permite acessar esta seção.", 403, "FORBIDDEN");
    return ok(await loaders[section]());
  } catch (error) { return controllerErrorResponse(error); }
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("user-status"), id: z.string().regex(/^\d+$/), role: z.enum(["client", "partner"]), active: z.boolean(), reason: z.string().trim().max(500).default("") }),
  z.object({ action: z.literal("partner-approval"), id: z.string().regex(/^\d+$/), approved: z.boolean(), reason: z.string().trim().max(500).default("") }),
  z.object({ action: z.literal("order-status"), id: z.string().regex(/^\d+$/), status: z.enum(["pending","quoted","approved","in_progress","waiting_parts","ready","completed","rejected","cancelled"]), reason: z.string().trim().min(3).max(500) }),
  z.object({ action: z.literal("review-moderation"), id: z.string().regex(/^\d+$/), status: z.enum(["published","hidden","flagged"]), reason: z.string().trim().max(500).default("") }),
  z.object({ action: z.literal("logistics-resolve"), id: z.string().regex(/^\d+$/), direction: z.enum(["pickup","return"]), note: z.string().trim().min(3).max(500) }),
  z.object({ action: z.literal("admin-role"), id: z.string().regex(/^\d+$/), accountRole: z.enum(["client","partner"]), role: z.enum(["owner","manager","analyst","support","finance","logistics"]), active: z.boolean() }),
]);

export async function PATCH(request: NextRequest) {
  try {
    const actor = await actorFrom(request);
    const access = await requireAdministrator(actor);
    const input = actionSchema.parse(await request.json());
    const requiredSection: Record<typeof input.action, AdminSection> = { "user-status": "users", "partner-approval": "partners", "order-status": "orders", "review-moderation": "reviews", "logistics-resolve": "logistics", "admin-role": "admins" };
    if (!access.permissions.includes(requiredSection[input.action])) throw new AppError("Seu papel não permite esta operação.", 403, "FORBIDDEN");
    if (input.action === "admin-role" && access.role !== "owner") throw new AppError("Somente o proprietário pode gerenciar administradores.", 403, "FORBIDDEN");
    if (input.action === "user-status" && input.id === actor.sub && input.role === actor.role && !input.active)
      throw new AppError("Você não pode bloquear a própria conta.", 422, "SELF_LOCKOUT");
    if (input.action === "admin-role" && input.id === actor.sub && input.accountRole === actor.role && (!input.active || input.role !== access.role))
      throw new AppError("Você não pode remover ou reduzir o próprio acesso administrativo.", 422, "SELF_LOCKOUT");
    if (input.action === "user-status" && !input.active && input.reason.length < 3)
      throw new AppError("Informe o motivo do bloqueio.", 422, "REASON_REQUIRED");
    if (input.action === "partner-approval" && !input.approved && input.reason.length < 3)
      throw new AppError("Informe o motivo da recusa.", 422, "REASON_REQUIRED");
    if (input.action === "review-moderation" && input.status !== "published" && input.reason.length < 3)
      throw new AppError("Informe o motivo da moderação.", 422, "REASON_REQUIRED");
    await sequelize.transaction(async (transaction) => {
      if (input.action === "user-status") {
        const table = input.role === "client" ? "clients" : "partner";
        const updated = await sequelize.query<{ id: string }>(
          `UPDATE ${table} SET is_active=:active, blocked_reason=CASE WHEN :active THEN NULL ELSE :reason END WHERE id=:id RETURNING id::text id`,
          { replacements: input, type: QueryTypes.SELECT, transaction },
        );
        if (!updated[0]) throw new AppError("Usuário não encontrado.", 404, "NOT_FOUND");
        await writeAdminAudit(actor, input.active ? "user.unblocked" : "user.blocked", input.role, input.id, { reason: input.reason }, transaction);
      } else if (input.action === "partner-approval") {
        const updated = await sequelize.query<{ id: string }>(`UPDATE partner SET is_approved=:approved,
          approval_reason=CASE WHEN :approved THEN NULL ELSE :reason END, approved_at=CASE WHEN :approved THEN now() ELSE NULL END,
          approved_by=:actor WHERE id=:id RETURNING id::text id`,
        { replacements: { ...input, actor: actor.sub }, type: QueryTypes.SELECT, transaction });
        if (!updated[0]) throw new AppError("Parceiro não encontrado.", 404, "NOT_FOUND");
        await writeAdminAudit(actor, input.approved ? "partner.approved" : "partner.rejected", "partner", input.id, { reason: input.reason }, transaction);
      } else if (input.action === "order-status") {
        const current = await sequelize.query<{ status: string; history: object[]; details: Record<string, unknown> }>(
          `SELECT status, history, service_details details FROM repair_orders WHERE id=:id FOR UPDATE`, { replacements: input, type: QueryTypes.SELECT, transaction });
        if (!current[0]) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
        const at = new Date().toISOString();
        const history = [...(current[0].history || []), { status: input.status, at }];
        const details = { ...(current[0].details || {}) } as Record<string, unknown>;
        const trail = Array.isArray(details.auditTrail) ? details.auditTrail : [];
        details.auditTrail = [...trail, { at, actorId: actor.sub, actorRole: "admin", action: `Intervenção: ${input.reason}`, fromStatus: current[0].status, toStatus: input.status }];
        await sequelize.query(`UPDATE repair_orders SET status=:status, history=CAST(:history AS jsonb), service_details=CAST(:details AS jsonb) WHERE id=:id`,
          { replacements: { id: input.id, status: input.status, history: JSON.stringify(history), details: JSON.stringify(details) }, transaction });
        await writeAdminAudit(actor, "order.status_changed", "order", input.id, { from: current[0].status, to: input.status, reason: input.reason }, transaction);
      } else if (input.action === "review-moderation") {
        const updated = await sequelize.query<{ id: string }>(`UPDATE reviews SET moderation_status=:status,
          moderation_reason=CASE WHEN :status='published' THEN NULL ELSE :reason END, moderated_at=now(), moderated_by=:actor
          WHERE id=:id RETURNING id::text id`,
          { replacements: { ...input, actor: actor.sub }, type: QueryTypes.SELECT, transaction });
        if (!updated[0]) throw new AppError("Avaliação não encontrada.", 404, "NOT_FOUND");
        await writeAdminAudit(actor, "review.moderated", "review", input.id, { status: input.status, reason: input.reason }, transaction);
      } else if (input.action === "logistics-resolve") {
        const path = `{logistics,${input.direction}}`;
        const updated = await sequelize.query<{ id: string }>(`UPDATE repair_orders SET service_details=jsonb_set(service_details, :path,
          COALESCE(service_details #> :path, '{}') || jsonb_build_object('status','resolved','error',NULL,'lastEventAt',now()::text,'resolutionNote',:note), true)
          WHERE id=:id AND service_details #> :path IS NOT NULL RETURNING id::text id`,
          { replacements: { id: input.id, path, note: input.note }, type: QueryTypes.SELECT, transaction });
        if (!updated[0]) throw new AppError("Ocorrência logística não encontrada.", 404, "NOT_FOUND");
        await writeAdminAudit(actor, "logistics.resolved", "order", input.id, { direction: input.direction, note: input.note }, transaction);
      } else {
        const accountTable = input.accountRole === "client" ? "clients" : "partner";
        const account = await sequelize.query<{ id: string }>(`SELECT id::text id FROM ${accountTable} WHERE id=:id FOR UPDATE`,
          { replacements: { id: input.id }, type: QueryTypes.SELECT, transaction });
        if (!account[0]) throw new AppError("Conta não encontrada.", 404, "NOT_FOUND");
        const permissions = [...permissionsForAdminRole(input.role)];
        await sequelize.query(`INSERT INTO admin_roles(account_id,account_role,role,permissions,is_active) VALUES(:id,:accountRole,:role,CAST(:permissions AS jsonb),:active)
          ON CONFLICT(account_id,account_role) DO UPDATE SET role=excluded.role,permissions=excluded.permissions,is_active=excluded.is_active,updated_at=now()`,
          { replacements: { ...input, permissions: JSON.stringify(permissions) }, transaction });
        await writeAdminAudit(actor, "admin.role_updated", "admin", `${input.accountRole}:${input.id}`, { role: input.role, permissions, active: input.active }, transaction);
      }
    });
    return ok({ updated: true });
  } catch (error) { return controllerErrorResponse(error); }
}
