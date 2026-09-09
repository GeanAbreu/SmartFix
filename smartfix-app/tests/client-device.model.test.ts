import assert from "node:assert/strict";
import test from "node:test";
import { ClientDevice } from "../src/models/ClientDevice";

test("mapeia todos os campos persistidos em client_devices", () => {
  const attributes = ClientDevice.getAttributes();

  assert.ok(attributes.client_id);
  assert.ok(attributes.tipo);
  assert.ok(attributes.marca);
  assert.ok(attributes.modelo);
  assert.ok(attributes.foto_url);
  assert.ok(attributes.apelido);
  assert.ok(attributes.numero_serie);
});

test("o ORM continua gerando UUID v4 com a dependência corrigida", () => {
  assert.match(ClientDevice.build().id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});
