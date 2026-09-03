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
});
