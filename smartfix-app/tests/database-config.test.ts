import assert from "node:assert/strict";
import test from "node:test";
import { usesLocalAuthStore } from "../src/services/local-auth.service";
import { assertDatabaseConfigured } from "../src/config/database";
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
    Object.assign(process.env, { NODE_ENV: "production" });
    assert.equal(usesLocalAuthStore(), false);
  } finally {
    process.env = previous;
  }
});
