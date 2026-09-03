import assert from "node:assert/strict";
import test from "node:test";
import { ClientAddress } from "../src/models/ClientAddress";

test("mapeia os atributos da aplicação para as colunas de client_addresses", () => {
  const attributes = ClientAddress.getAttributes();

  assert.equal(attributes.cidade.field, "municipio");
  assert.equal(attributes.estado.field, "uf");
  assert.equal(attributes.principal.field, "is_principal");
});
