import assert from "node:assert/strict";
import test from "node:test";
import { getAuthSecret } from "../src/services/auth-secret.service";

test("prefere SESSION_SECRET quando configurado", () => {
  const previous = { ...process.env };
  try {
    process.env.SESSION_SECRET = "session-secret-explicito-com-mais-de-32-caracteres";
    process.env.SUPABASE_JWT_SECRET = "supabase-secret-com-mais-de-32-caracteres";
    assert.equal(getAuthSecret(), process.env.SESSION_SECRET);
  } finally {
    process.env = previous;
  }
});

test("deriva uma chave de autenticação estável do segredo Supabase", () => {
  const previous = { ...process.env };
  try {
    Object.assign(process.env, { NODE_ENV: "production" });
    process.env.SESSION_SECRET = "";
    process.env.SUPABASE_JWT_SECRET =
      "supabase-production-secret-with-more-than-32-characters";
    const first = getAuthSecret();
    const second = getAuthSecret();
    assert.equal(first, second);
    assert.equal(first.length, 64);
    assert.notEqual(first, process.env.SUPABASE_JWT_SECRET);
  } finally {
    process.env = previous;
  }
});
