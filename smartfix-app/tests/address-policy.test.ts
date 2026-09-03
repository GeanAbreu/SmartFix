import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../src/errors/AppError";
import { assertAddressCanBeDeleted } from "../src/services/address-policy.service";

test("impede a exclusão do endereço principal", () => {
  assert.throws(
    () => assertAddressCanBeDeleted(true, 2),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 409 &&
      error.code === "PRIMARY_ADDRESS_CANNOT_BE_DELETED"
  );
});

test("impede que o cliente fique sem endereço", () => {
  assert.throws(
    () => assertAddressCanBeDeleted(false, 1),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 409 &&
      error.code === "LAST_ADDRESS_CANNOT_BE_DELETED"
  );
});

test("permite excluir um endereço secundário quando existe outro", () => {
  assert.doesNotThrow(() => assertAddressCanBeDeleted(false, 2));
});
