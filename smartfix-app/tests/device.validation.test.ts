import assert from "node:assert/strict";
import test from "node:test";
import { deviceInputSchema } from "../src/validations/device.validation";

const validDevice = {
  tipo: "Smartphone",
  marca: "Apple",
  modelo: "iPhone 15",
  fotoUrl: "data:image/png;base64,aGVsbG8=",
};

test("aceita um dispositivo e uma foto válidos", () => {
  const result = deviceInputSchema.parse(validDevice);
  assert.equal(result.modelo, "iPhone 15");
});

test("rejeita combinações inexistentes de tipo, marca e modelo", () => {
  const result = deviceInputSchema.safeParse({
    ...validDevice,
    marca: "Samsung",
  });
  assert.equal(result.success, false);
});

test("rejeita formatos de foto não permitidos", () => {
  const result = deviceInputSchema.safeParse({
    ...validDevice,
    fotoUrl: "data:image/svg+xml;base64,PHN2Zz4=",
  });
  assert.equal(result.success, false);
});

test("aceita o tipo de problema informado no cadastro", () => {
  const result = deviceInputSchema.parse({ ...validDevice, issueType: "Tela quebrada" });
  assert.equal(result.issueType, "Tela quebrada");
});

test("limita o tipo de problema ao tamanho aceito pelo cadastro", () => {
  const result = deviceInputSchema.safeParse({ ...validDevice, issueType: "x".repeat(151) });
  assert.equal(result.success, false);
});
