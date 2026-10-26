import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { withRateLimit } from "../src/services/rate-limit.service";

test("limita tentativas por cliente sem executar novamente o controlador", async () => {
  const marker = `${Date.now()}-${Math.random()}`;
  const request = () => new NextRequest("http://localhost/api/test", { method: "POST",
    headers: { "x-forwarded-for": "192.0.2.55", "user-agent": marker } });
  let calls = 0;
  const handler = async () => { calls += 1; return Response.json({ ok: true }); };
  assert.equal((await withRateLimit(request(), `test:${marker}`, 2, 60_000, handler)).status, 200);
  assert.equal((await withRateLimit(request(), `test:${marker}`, 2, 60_000, handler)).status, 200);
  const blocked = await withRateLimit(request(), `test:${marker}`, 2, 60_000, handler);
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
  assert.equal(calls, 2);
});
