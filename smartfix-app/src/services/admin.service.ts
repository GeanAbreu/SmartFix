import "server-only";
import { QueryTypes, type Transaction } from "sequelize";
import sequelize, { assertDatabaseConfigured } from "@/src/config/database";
import { AppError } from "@/src/errors/AppError";
import type { SessionPayload } from "@/src/services/session.service";
import { usesLocalAuthStore } from "@/src/services/local-auth.service";

export const ADMIN_SECTIONS = ["dashboard", "users", "partners", "orders", "reviews", "finance", "logistics", "support", "admins", "audit"] as const;
export type AdminSection = (typeof ADMIN_SECTIONS)[number];
export const ADMIN_ROLES = ["owner", "manager", "analyst", "support", "finance", "logistics"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminSection[]> = {
  owner: ADMIN_SECTIONS,
  manager: ["dashboard", "users", "partners", "orders", "reviews", "finance", "logistics", "support", "audit"],
  analyst: ["dashboard", "partners", "orders", "reviews", "audit"],
  support: ["dashboard", "users", "orders", "support"],
  finance: ["dashboard", "finance", "orders"],
  logistics: ["dashboard", "logistics", "orders"],
};

export function permissionsForAdminRole(role: AdminRole): readonly AdminSection[] {
  return ROLE_PERMISSIONS[role];
}

export async function requireAdministrator(actor: SessionPayload) {
  const configured = (process.env.ADMIN_USER_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (configured.includes(actor.sub)) return { role: "owner", permissions: ADMIN_SECTIONS };
  if (usesLocalAuthStore()) throw new AppError("Acesso administrativo não autorizado.", 403, "FORBIDDEN");
  assertDatabaseConfigured();
  const rows = await sequelize.query<{ role: string }>(
    `SELECT role FROM admin_roles WHERE account_id = :id AND account_role = :accountRole AND is_active = true`,
    { replacements: { id: actor.sub, accountRole: actor.role }, type: QueryTypes.SELECT },
  );
  if (!rows[0]) throw new AppError("Acesso administrativo não autorizado.", 403, "FORBIDDEN");
  if (!ADMIN_ROLES.includes(rows[0].role as AdminRole))
    throw new AppError("Papel administrativo inválido.", 403, "FORBIDDEN");
  const role = rows[0].role as AdminRole;
  return { role, permissions: permissionsForAdminRole(role) };
}

export async function writeAdminAudit(actor: SessionPayload, action: string, entityType: string, entityId: string, details: object = {}, transaction?: Transaction) {
  await sequelize.query(
    `INSERT INTO admin_audit_logs (actor_id, actor_role, action, entity_type, entity_id, details)
     VALUES (:actorId, :actorRole, :action, :entityType, :entityId, CAST(:details AS jsonb))`,
    { replacements: { actorId: actor.sub, actorRole: actor.role, action, entityType, entityId, details: JSON.stringify(details) }, transaction },
  );
}

function paging(searchParams: URLSearchParams) {
  const integer = (value: string | null, fallback: number, min: number, max: number) => {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  };
  const page = integer(searchParams.get("page"), 1, 1, 10_000);
  const limit = integer(searchParams.get("limit"), 20, 5, 50);
  return { page, limit, offset: (page - 1) * limit, search: (searchParams.get("search") || "").trim(), status: (searchParams.get("status") || "").trim() };
}

export async function adminDashboard() {
  assertDatabaseConfigured();
  const [metrics, statuses, recent] = await Promise.all([
    sequelize.query<Record<string, string>>(`SELECT
      (SELECT count(*) FROM clients) clients,
      (SELECT count(*) FROM partner) partners,
      (SELECT count(*) FROM partner WHERE is_approved = false AND NULLIF(BTRIM(approval_reason), '') IS NULL) pending_partners,
      (SELECT count(*) FROM repair_orders) orders,
      (SELECT count(*) FROM repair_orders WHERE status NOT IN ('completed','cancelled','rejected')) active_orders,
      (SELECT count(*) FROM repair_orders WHERE status = 'completed') completed_orders,
      (SELECT count(*) FROM reviews) reviews,
      (SELECT COALESCE(round(avg(rating)::numeric, 2), 0) FROM reviews WHERE moderation_status = 'published') rating,
      (SELECT COALESCE(sum((item->>'unitPriceCents')::bigint * (item->>'quantity')::bigint), 0)
        FROM repair_orders o CROSS JOIN LATERAL jsonb_array_elements(o.quote) item
        WHERE o.service_details->>'paymentStatus' = 'confirmed') revenue_cents,
      (SELECT count(*) FROM repair_orders WHERE service_details->>'refundStatus' = 'pending') pending_refunds` , { type: QueryTypes.SELECT }),
    sequelize.query<{ status: string; total: string }>(`SELECT status, count(*) total FROM repair_orders GROUP BY status ORDER BY total DESC`, { type: QueryTypes.SELECT }),
    sequelize.query(`SELECT o.id, o.device_label device, o.status, o.created_at "createdAt", c.full_name "clientName", p.company_name "partnerName"
      FROM repair_orders o JOIN clients c ON c.id=o.client_id JOIN partner p ON p.id=o.partner_id
      ORDER BY o.created_at DESC LIMIT 8`, { type: QueryTypes.SELECT }),
  ]);
  return { metrics: metrics[0], statuses, recent };
}

export async function adminUsers(searchParams: URLSearchParams) {
  const { page, limit, offset, search, status } = paging(searchParams);
  const replacements = { search: `%${search}%`, limit, offset, active: status === "blocked" ? false : true };
  const activeFilter = status === "active" || status === "blocked" ? `AND is_active = :active` : "";
  const rows = await sequelize.query(`SELECT * FROM (
      SELECT id::text, 'client' role, full_name name, email, phone, tax_id document, is_active "isActive", blocked_reason "blockedReason", created_at "createdAt" FROM clients
      UNION ALL
      SELECT id::text, 'partner' role, COALESCE(company_name, full_name) name, email, phone, tax_id document, is_active "isActive", blocked_reason "blockedReason", created_at "createdAt" FROM partner
    ) users WHERE (name ILIKE :search OR email ILIKE :search OR COALESCE(document,'') ILIKE :search) ${activeFilter}
    ORDER BY "createdAt" DESC LIMIT :limit OFFSET :offset`, { replacements, type: QueryTypes.SELECT });
  const count = await sequelize.query<{ total: string }>(`SELECT count(*) total FROM (
      SELECT full_name name,email,tax_id document,is_active FROM clients UNION ALL
      SELECT COALESCE(company_name,full_name),email,tax_id,is_active FROM partner
    ) users WHERE (name ILIKE :search OR email ILIKE :search OR COALESCE(document,'') ILIKE :search) ${activeFilter}`,
    { replacements, type: QueryTypes.SELECT });
  const total = Number(count[0]?.total || 0);
  return { items: rows, total, page, limit, hasMore: offset + rows.length < total };
}

export async function adminPartners(searchParams: URLSearchParams) {
  const { page, limit, offset, search, status } = paging(searchParams);
  const approval = status === "approved"
    ? "AND p.is_approved=true"
    : status === "pending"
      ? "AND p.is_approved=false AND NULLIF(BTRIM(p.approval_reason), '') IS NULL"
      : status === "rejected"
        ? "AND p.is_approved=false AND NULLIF(BTRIM(p.approval_reason), '') IS NOT NULL"
        : "";
  const items = await sequelize.query(`SELECT p.id::text, p.full_name "ownerName", p.company_name name, p.email, p.phone, p.tax_id document,
      p.trade_license "tradeLicense", p.document_url "documentUrl", p.is_approved "isVerified", p.is_active "isActive",
      p.approval_reason "approvalReason", p.created_at "createdAt", count(DISTINCT o.id) "orderCount", COALESCE(round(avg(r.rating)::numeric,2),0) rating
    FROM partner p LEFT JOIN repair_orders o ON o.partner_id=p.id LEFT JOIN reviews r ON r.partner_id=p.id AND r.moderation_status='published'
    WHERE (COALESCE(p.company_name,p.full_name) ILIKE :search OR p.email ILIKE :search OR COALESCE(p.tax_id,'') ILIKE :search) ${approval}
    GROUP BY p.id ORDER BY p.created_at DESC LIMIT :fetchLimit OFFSET :offset`,
    { replacements: { search: `%${search}%`, fetchLimit: limit + 1, offset }, type: QueryTypes.SELECT });
  return { items: items.slice(0, limit), page, limit, hasMore: items.length > limit };
}

export async function adminOrders(searchParams: URLSearchParams) {
  const { page, limit, offset, search, status } = paging(searchParams);
  const items = await sequelize.query(`SELECT o.id::text, o.device_label device, o.problem_description problem, o.status, o.created_at "createdAt",
      o.history, o.service_details "serviceDetails", o.quote, c.full_name "clientName", c.email "clientEmail",
      COALESCE(p.company_name,p.full_name) "partnerName",
      COALESCE((SELECT sum((x->>'unitPriceCents')::bigint*(x->>'quantity')::bigint) FROM jsonb_array_elements(o.quote) x),0) "totalCents"
    FROM repair_orders o JOIN clients c ON c.id=o.client_id JOIN partner p ON p.id=o.partner_id
    WHERE (o.id::text ILIKE :search OR o.device_label ILIKE :search OR c.full_name ILIKE :search OR COALESCE(p.company_name,p.full_name) ILIKE :search)
      AND (:status='' OR o.status=:status)
    ORDER BY o.created_at DESC LIMIT :fetchLimit OFFSET :offset`,
    { replacements: { search: `%${search}%`, status, fetchLimit: limit + 1, offset }, type: QueryTypes.SELECT });
  return { items: items.slice(0, limit), page, limit, hasMore: items.length > limit };
}

export async function adminReviews(searchParams: URLSearchParams) {
  const { page, limit, offset, search, status } = paging(searchParams);
  const items = await sequelize.query(`SELECT r.id::text, r.rating, r.comment, r.review_date "reviewDate", r.moderation_status "moderationStatus",
      r.moderation_reason "moderationReason", c.full_name "clientName", COALESCE(p.company_name,p.full_name) "partnerName", r.repair_order_id::text "orderId"
    FROM reviews r JOIN clients c ON c.id=r.client_id JOIN partner p ON p.id=r.partner_id
    WHERE (r.comment ILIKE :search OR c.full_name ILIKE :search OR COALESCE(p.company_name,p.full_name) ILIKE :search)
      AND (:status='' OR r.moderation_status=:status)
    ORDER BY r.review_date DESC, r.id DESC LIMIT :fetchLimit OFFSET :offset`,
    { replacements: { search: `%${search}%`, status, fetchLimit: limit + 1, offset }, type: QueryTypes.SELECT });
  return { items: items.slice(0, limit), page, limit, hasMore: items.length > limit };
}

export async function adminFinance(searchParams: URLSearchParams) {
  const { limit, offset, search, status, page } = paging(searchParams);
  const items = await sequelize.query(`SELECT o.id::text "orderId", o.device_label device, o.status, o.created_at "createdAt",
      COALESCE(p.company_name,p.full_name) "partnerName", o.service_details "serviceDetails",
      COALESCE((SELECT sum((x->>'unitPriceCents')::bigint*(x->>'quantity')::bigint) FROM jsonb_array_elements(o.quote) x),0) "totalCents"
    FROM repair_orders o JOIN partner p ON p.id=o.partner_id
    WHERE (o.id::text ILIKE :search OR COALESCE(p.company_name,p.full_name) ILIKE :search)
      AND (:status='' OR o.service_details->>'paymentStatus'=:status OR o.service_details->>'refundStatus'=:status)
    ORDER BY o.created_at DESC LIMIT :fetchLimit OFFSET :offset`,
    { replacements: { search: `%${search}%`, status, fetchLimit: limit + 1, offset }, type: QueryTypes.SELECT });
  return { items: items.slice(0, limit), page, limit, hasMore: items.length > limit };
}

export async function adminAdmins() {
  return sequelize.query(`SELECT a.account_id::text id, a.account_role "accountRole", a.role, a.permissions, a.is_active "isActive",
      COALESCE(c.full_name,p.full_name) name, COALESCE(c.email,p.email) email, a.created_at "createdAt"
    FROM admin_roles a LEFT JOIN clients c ON a.account_role='client' AND c.id=a.account_id
      LEFT JOIN partner p ON a.account_role='partner' AND p.id=a.account_id ORDER BY a.created_at DESC`, { type: QueryTypes.SELECT });
}

export async function adminAudit(searchParams: URLSearchParams) {
  const { limit, offset, search, page } = paging(searchParams);
  const items = await sequelize.query(`SELECT id::text, actor_id "actorId", actor_role "actorRole", action, entity_type "entityType",
      entity_id "entityId", details, created_at "createdAt" FROM admin_audit_logs
    WHERE action ILIKE :search OR entity_type ILIKE :search OR entity_id ILIKE :search
    ORDER BY created_at DESC LIMIT :fetchLimit OFFSET :offset`, { replacements: { search: `%${search}%`, fetchLimit: limit + 1, offset }, type: QueryTypes.SELECT });
  return { items: items.slice(0, limit), page, limit, hasMore: items.length > limit };
}
