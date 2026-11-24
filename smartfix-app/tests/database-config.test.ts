import assert from "node:assert/strict";
import test from "node:test";
import { usesLocalAuthStore } from "../src/services/local-auth.service";
import {
  assertDatabaseConfigured,
  databaseUrlWithDriverSsl,
  getPoolMax,
} from "../src/config/database";
import { DatabaseController } from "../src/controllers/DatabaseController";

test("não simula persistência PostgreSQL quando a conexão está ausente", async () => {
  const previous = { ...process.env };
  try {
    Object.assign(process.env, { NODE_ENV: "development", DATABASE_URL: "", SMARTFIX_LOCAL_AUTH: "false" });
    assert.equal(usesLocalAuthStore(), false);
    assert.throws(assertDatabaseConfigured, { code: "DATABASE_NOT_CONFIGURED" });
    const response = await DatabaseController.health();
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "DATABASE_NOT_CONFIGURED");
    process.env.SMARTFIX_LOCAL_AUTH = "true";
    assert.equal(usesLocalAuthStore(), true);
    process.env.DATABASE_URL = "postgresql://localhost/test";
    assert.equal(usesLocalAuthStore(), false);
    process.env.DATABASE_URL = "";
    process.env.POSTGRES_URL = "postgresql://localhost/test";
    assert.doesNotThrow(assertDatabaseConfigured);
    assert.equal(usesLocalAuthStore(), false);
    process.env.POSTGRES_URL = "";
    Object.assign(process.env, { NODE_ENV: "production" });
    assert.equal(usesLocalAuthStore(), false);
  } finally {
    process.env = previous;
  }
});

test("preserva parâmetros da conexão e delega SSL ao driver configurado", () => {
  const normalized = new URL(databaseUrlWithDriverSsl(
    "postgresql://user:password@example.com/postgres?sslmode=require&pgbouncer=true",
  ));
  assert.equal(normalized.searchParams.has("sslmode"), false);
  assert.equal(normalized.searchParams.get("pgbouncer"), "true");
});

test("usa o transaction pooler do Supabase na Vercel", () => {
  const previousVercel = process.env.VERCEL;
  try {
    process.env.VERCEL = "1";
    const normalized = new URL(databaseUrlWithDriverSsl(
      "postgresql://postgres.project:password@aws-0-sa-east-1.pooler.supabase.com:5432/postgres",
    ));
    assert.equal(normalized.port, "6543");

    process.env.VERCEL = "";
    const local = new URL(databaseUrlWithDriverSsl(
      "postgresql://postgres.project:password@aws-0-sa-east-1.pooler.supabase.com:5432/postgres",
    ));
    assert.equal(local.port, "5432");
  } finally {
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
  }
});

test("limita cada instância serverless a uma conexão com o banco", () => {
  const previousVercel = process.env.VERCEL;
  const previousPoolMax = process.env.DB_POOL_MAX;
  try {
    process.env.VERCEL = "1";
    process.env.DB_POOL_MAX = "5";
    assert.equal(getPoolMax(), 1);

    process.env.VERCEL = "";
    assert.equal(getPoolMax(), 5);
  } finally {
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
    if (previousPoolMax === undefined) delete process.env.DB_POOL_MAX;
    else process.env.DB_POOL_MAX = previousPoolMax;
  }
});
