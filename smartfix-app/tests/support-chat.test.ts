import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function source(relativePath: string) {
  return readFile(path.resolve(relativePath), "utf8");
}

test("a caixa de mensagens usa o nome físico atual de clients", async () => {
  const partnerRoute = await source("app/api/partners/support/conversations/route.ts");
  const adminRoute = await source("app/api/admin/support/conversations/route.ts");

  for (const route of [partnerRoute, adminRoute]) {
    assert.match(route, /c\.full_name/);
    assert.doesNotMatch(route, /c\.nome/);
  }
});

test("a leitura e a escrita do parceiro exigem vínculo com uma ordem", async () => {
  const listRoute = await source("app/api/partners/support/conversations/route.ts");
  const messagesRoute = await source("app/api/partners/support/conversations/[clientId]/messages/route.ts");

  assert.match(listRoute, /FROM public\.repair_orders o[\s\S]*WHERE o\.partner_id = \$1/);
  assert.match(listRoute, /LEFT JOIN LATERAL[\s\S]*support_messages/);
  assert.equal((messagesRoute.match(/await requireLinkedClient\(clientId, actor\.sub\)/g) ?? []).length, 2);
  assert.match(messagesRoute, /WHERE client_id = \$1 AND partner_id = \$2/);
});

test("uma primeira mensagem cria implicitamente a conversa vinculada", async () => {
  const clientRoute = await source("app/api/support/messages/route.ts");
  assert.match(clientRoute, /await authorizedPartner\(actor\.sub, partnerId\)/);
  assert.match(clientRoute, /INSERT INTO public\.support_messages/);
  assert.match(clientRoute, /partnerId \? "partner" : "smartfix"/);
});
