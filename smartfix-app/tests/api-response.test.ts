import assert from "node:assert/strict";
import test from "node:test";
import { readApiResponse } from "../src/services/api-response.service";

test("lê uma resposta JSON válida da API", async () => {
  const response = new Response(
    JSON.stringify({ success: true, data: { redirectTo: "/painel" } }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );

  const result = await readApiResponse<{ redirectTo: string }>(response);

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.redirectTo, "/painel");
  }
});

test("não expõe erro de parser quando o servidor devolve HTML", async () => {
  const response = new Response("<!DOCTYPE html><title>Not found</title>", {
    status: 404,
    headers: { "Content-Type": "text/html" },
  });

  await assert.rejects(
    () => readApiResponse(response),
    /O serviço de autenticação não foi encontrado/
  );
});

test("trata JSON malformado como indisponibilidade do serviço", async () => {
  const response = new Response("{invalid", {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });

  await assert.rejects(
    () => readApiResponse(response),
    /O serviço de autenticação está temporariamente indisponível/
  );
});
