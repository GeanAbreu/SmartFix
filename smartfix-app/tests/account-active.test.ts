import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { Client } from "../src/models";
import { Workflow } from "../src/models/Workflow";
import { actorFrom } from "../src/services/account.service";
import { createSessionToken } from "../src/services/session.service";

test("a autenticação rejeita imediatamente uma conta bloqueada", async (t) => {
  const previous = { ...process.env };
  process.env.DATABASE_URL = "postgres://test:test@localhost/test";
  process.env.SESSION_SECRET = "blocked-account-test-secret-with-32-characters";
  const id = "42";
  let active = false;

  t.mock.method(Workflow, "findAll", async () => []);
  t.mock.method(Client, "unscoped", () => ({
    findByPk: async () => ({
      id,
      nome: "Cliente Teste",
      email: "cliente@example.test",
      telefone: "11999999999",
      senha: "hash",
      is_active: active,
    }),
  }));

  const request = () => new NextRequest("http://localhost:3000/api/clients/me", {
    headers: {
      cookie: `smartfix_session=${createSessionToken({ sub: id, role: "client" })}`,
    },
  });

  try {
    await assert.rejects(actorFrom(request()), {
      code: "UNAUTHENTICATED",
      statusCode: 401,
    });

    active = true;
    assert.equal((await actorFrom(request())).sub, id);
  } finally {
    process.env = previous;
  }
});
