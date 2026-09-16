import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";

test("cadastro de cliente e parceiro salva endereço separado e mantém o proprietário", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "smartfix-address-registration-"));
  const previous = { ...process.env };
  Object.assign(process.env, { NODE_ENV: "development", SMARTFIX_LOCAL_AUTH: "true", SMARTFIX_LOCAL_DATA_DIR: directory });
  delete process.env.DATABASE_URL;
  try {
    const { AuthController } = await import("../src/controllers/AuthController");
    const { listLocalAddresses } = await import("../src/services/local-auth.service");
    const common = { nomeCompleto: "Cadastro Teste", telefone: "11999999999", senha: "Senha@123",
      confirmarSenha: "Senha@123", cep: "01001000", rua: "Praça da Sé", numero: "42",
      complemento: "Sala 1", bairro: "Sé", municipio: "São Paulo", uf: "SP" };
    for (const registration of [
      { tipoUsuario: "cliente", email: "client@example.test", documento: "52998224725", dataNascimento: "1990-05-20" },
      { tipoUsuario: "parceiro", email: "partner@example.test", documento: "11222333000181", dataNascimento: "" },
    ]) {
      const response = await AuthController.register(new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...common, ...registration }),
      }));
      assert.equal(response.status, 201, JSON.stringify(await response.json()));
    }
    const store = JSON.parse(await readFile(path.join(directory, "auth.json"), "utf8"));
    assert.equal(store.users.length, 2);
    assert.equal(store.addresses.length, 2);
    for (const user of store.users) {
      for (const field of ["address", "city", "state", "zipCode"]) assert.equal(field in user, false);
      const address = store.addresses.find((entry: { clientId: string | null; partnerId?: string | null }) =>
        user.role === "client" ? entry.clientId === user.id : entry.partnerId === user.id);
      assert.ok(address);
      assert.equal(address.numero, "42");
      assert.equal(address.complemento, "Sala 1");
      assert.equal(address.principal, true);
      assert.equal(user.role === "client" ? address.partnerId : address.clientId, null);
    }
    const client = store.users.find((user: { role: string }) => user.role === "client");
    assert.equal((await listLocalAddresses(client.id)).length, 1);
  } finally {
    process.env = previous;
    await rm(directory, { recursive: true, force: true });
  }
});
