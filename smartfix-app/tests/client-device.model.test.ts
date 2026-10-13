import assert from "node:assert/strict";
import test from "node:test";
import { ClientDevice } from "../src/models/ClientDevice";

test("mapeia os campos da API para devices conforme o DER", () => {
  const attributes = ClientDevice.getAttributes();

  assert.ok(attributes.client_id);
  assert.ok(attributes.tipo);
  assert.ok(attributes.marca);
  assert.ok(attributes.modelo);
  assert.ok(attributes.foto_url);
  assert.ok(attributes.apelido);
  assert.equal(attributes.numero_serie, undefined);
  assert.equal(ClientDevice.tableName, "devices");
  assert.equal(attributes.client_id.field, "user_id");
  assert.equal(attributes.tipo.field, "device_type");
  assert.equal(attributes.marca.field, "brand");
  assert.equal(attributes.modelo.field, "model");
  assert.equal(attributes.issue_type, undefined);
  assert.ok(attributes.issue_description);
});

test("o ORM delega ao PostgreSQL a geração do ID sequencial", () => {
  const id = ClientDevice.getAttributes().id;
  assert.equal(id.autoIncrement, true);
  assert.equal(String(id.type), "BIGINT");
});
