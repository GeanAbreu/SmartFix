import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { PATCH } from "../app/api/admin/console/[section]/route";
import sequelize from "../src/config/database";
import { Client } from "../src/models";
import { Workflow } from "../src/models/Workflow";
import { createSessionToken } from "../src/services/session.service";

test("mutação administrativa não audita entidade inexistente nem permite auto-bloqueio", async (t) => {
  const previous = { ...process.env };
  process.env.DATABASE_URL = "postgres://test:test@localhost/test";
  process.env.SESSION_SECRET = "admin-route-test-secret-with-at-least-32-characters";
  process.env.ADMIN_USER_IDS = "42";

  t.mock.method(Workflow, "findAll", async () => []);
  t.mock.method(Client, "unscoped", () => ({
    findByPk: async () => ({
      id: "42",
      nome: "Administrador",
      email: "admin@example.test",
      telefone: "11999999999",
      senha: "hash",
      is_active: true,
    }),
  }));

  const queries: string[] = [];
  let transactions = 0;
  const database = sequelize as unknown as {
    query: (sql: string, options?: unknown) => Promise<unknown[]>;
    transaction: (callback: (transaction: unknown) => Promise<unknown>) => Promise<unknown>;
  };
  t.mock.method(database, "query", async (sql: string) => {
    queries.push(sql);
    if (/^UPDATE clients/i.test(sql.trim())) return [];
    throw new Error(`Consulta inesperada no teste: ${sql}`);
  });
  t.mock.method(database, "transaction", async (callback: (transaction: unknown) => Promise<unknown>) => {
    transactions += 1;
    return callback({});
  });

  const request = (body: object) => new NextRequest("http://localhost/api/admin/console/users", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      cookie: `smartfix_session=${createSessionToken({ sub: "42", role: "client" })}`,
    },
    body: JSON.stringify(body),
  });

  try {
    const missing = await PATCH(request({
      action: "user-status",
      id: "999",
      role: "client",
      active: false,
      reason: "Abuso confirmado",
    }));
    assert.equal(missing.status, 404);
    assert.ok(!queries.some((sql) => /admin_audit_logs/i.test(sql)));

    const selfLockout = await PATCH(request({
      action: "user-status",
      id: "42",
      role: "client",
      active: false,
      reason: "Teste indevido",
    }));
    assert.equal(selfLockout.status, 422);
    assert.equal(transactions, 1);
  } finally {
    process.env = previous;
  }
});
