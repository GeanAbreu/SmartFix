import "server-only";
import type { NextRequest } from "next/server";
import { Client, Partner } from "@/src/models";
import { assertDatabaseConfigured } from "@/src/config/database";
import { requireSession } from "@/src/middlewares/auth.middleware";
import { AppError } from "@/src/errors/AppError";
import {
  findLocalUserById,
  findLocalUserByEmail,
  usesLocalAuthStore,
  updateLocalPassword,
} from "./local-auth.service";
import type { SessionRole } from "@/src/types/api";

export async function accountById(id: string, role: SessionRole) {
  if (usesLocalAuthStore()) {
    const user = await findLocalUserById(id);
    return user?.role === role
      ? {
          id,
          role,
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
        }
      : null;
  }
  assertDatabaseConfigured();
  if (role === "client") {
    const user = await Client.unscoped().findByPk(id);
    return user
      ? {
          id,
          role,
          name: user.nome,
          email: user.email,
          passwordHash: user.senha,
        }
      : null;
  }
  const user = await Partner.unscoped().findByPk(id);
  return user
    ? {
        id,
        role,
        name: user.full_name,
        email: user.email,
        passwordHash: user.password_hash,
      }
    : null;
}
export async function accountByEmail(email: string) {
  if (usesLocalAuthStore()) {
    const user = await findLocalUserByEmail(email);
    return user ? accountById(user.id, user.role) : null;
  }
  assertDatabaseConfigured();
  const client = await Client.findOne({ where: { email }, attributes: ["id"] });
  if (client) return accountById(client.id, "client");
  const partner = await Partner.findOne({
    where: { email },
    attributes: ["id"],
  });
  return partner ? accountById(partner.id, "partner") : null;
}
export async function actorFrom(request: NextRequest) {
  const actor = await requireSession(request);
  if (!(await accountById(actor.sub, actor.role)))
    throw new AppError("Sessão inválida.", 401, "UNAUTHENTICATED");
  if (!["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const expected = process.env.APP_URL
      ? new URL(process.env.APP_URL).origin
      : request.nextUrl.origin;
    if (origin && origin !== expected)
      throw new AppError("Origem inválida.", 403, "FORBIDDEN");
  }
  return actor;
}
export function isAdministrator(id: string) {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(id);
}
export async function changePassword(
  id: string,
  role: SessionRole,
  hash: string,
  expectedHash: string,
) {
  if (usesLocalAuthStore()) return updateLocalPassword(id, hash, expectedHash);
  assertDatabaseConfigured();
  const [count] =
    role === "client"
      ? await Client.update(
          { senha: hash },
          { where: { id, senha: expectedHash } },
        )
      : await Partner.update(
          { password_hash: hash },
          { where: { id, password_hash: expectedHash } },
        );
  if (!count)
    throw new AppError("Link inválido. Solicite outro.", 422, "INVALID_RESET");
}
