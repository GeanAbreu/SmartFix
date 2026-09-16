import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

loadEnvConfig(process.cwd(), true);

async function main() {
  const { default: sequelize, assertDatabaseConfigured } = await import("../src/config/database");
  const { Client, ClientAddress, ClientDevice, Partner } = await import("../src/models");
  assertDatabaseConfigured();
  try {
    const transaction = await sequelize.transaction();
    try {
      const suffix = randomUUID();
      const client = await Client.create({ nome: "Teste transacional SmartFix", email: `${suffix}@example.invalid`,
        cpf: suffix.replaceAll("-", "").slice(0, 11), senha: "hash-test-only-never-committed" }, { transaction });
      const address = await ClientAddress.create({ client_id: client.id, apelido: "Teste", cep: "01001000",
        logradouro: "Rua Teste", numero: "1", bairro: "Centro", cidade: "São Paulo", estado: "SP", principal: true }, { transaction });
      const device = await ClientDevice.create({ client_id: client.id, tipo: "Smartphone", marca: "Apple",
        modelo: "iPhone 13", foto_url: "data:image/png;base64,dGVzdA==", apelido: "Teste", numero_serie: "teste" }, { transaction });
      assert.equal((await Client.findByPk(client.id, { transaction }))?.nome, client.nome);
      assert.equal((await ClientAddress.findByPk(address.id, { transaction }))?.cidade, "São Paulo");
      await device.update({ apelido: "Atualizado" }, { transaction });
      assert.equal((await ClientDevice.findByPk(device.id, { transaction }))?.apelido, "Atualizado");
      const otherClientId = randomUUID();
      assert.equal(await ClientAddress.findOne({ where: { id: address.id, client_id: otherClientId }, transaction }), null);
      assert.equal(await ClientDevice.findOne({ where: { id: device.id, client_id: otherClientId }, transaction }), null);
      const partner = await Partner.create({ full_name: "Parceiro Teste", email: `partner-${suffix}@example.invalid`,
        cnpj: suffix.replaceAll("-", "").slice(0, 14), password_hash: "hash-test-only-never-committed" }, { transaction });
      assert.equal((await Partner.findByPk(partner.id, { transaction }))?.full_name, "Parceiro Teste");
      const partnerAddress = await ClientAddress.create({ partner_id: partner.id, apelido: "Sede",
        cep: "01001000", logradouro: "Rua Teste", numero: "2", bairro: "Centro",
        cidade: "São Paulo", estado: "SP", principal: true }, { transaction });
      assert.equal(partnerAddress.client_id, null);
      assert.equal((await ClientAddress.findByPk(partnerAddress.id, { transaction }))?.partner_id, partner.id);
      assert.equal(await ClientAddress.findOne({ where: { id: partnerAddress.id, client_id: client.id }, transaction }), null);
      for (const owners of [
        { client_id: null, partner_id: null },
        { client_id: client.id, partner_id: partner.id },
        { client_id: null, partner_id: randomUUID() },
      ]) {
        await assert.rejects(sequelize.transaction({ transaction }, async (savepoint) => {
          await ClientAddress.create({ ...owners, apelido: "Inválido", cep: "01001000",
            logradouro: "Rua Teste", numero: "1", bairro: "Centro", cidade: "São Paulo", estado: "SP" }, { transaction: savepoint });
        }), (error: unknown) => ["23514", "23503"].includes((error as { original?: { code?: string } }).original?.code ?? ""));
      }
      await partner.destroy({ transaction });
      assert.equal(await ClientAddress.findByPk(partnerAddress.id, { transaction }), null);
      await client.destroy({ transaction });
      assert.equal(await ClientAddress.findByPk(address.id, { transaction }), null);
      assert.equal(await ClientDevice.findByPk(device.id, { transaction }), null);
      console.log("CRUD, endereços de clientes/parceiros, proprietário exclusivo, isolamento e FKs: OK.");
    } finally {
      // No fixture or deletion survives this verification, including on failure.
      await transaction.rollback();
    }
    for (const role of ["anon", "authenticated"]) {
      const transaction = await sequelize.transaction();
      try {
        await sequelize.query(`SET LOCAL ROLE ${role}`, { transaction });
        await assert.rejects(Client.findAll({ limit: 1, transaction }), (error: unknown) =>
          (error as { original?: { code?: string } }).original?.code === "42501");
        console.log(`Acesso direto ${role}: bloqueado.`);
      } finally {
        await transaction.rollback();
      }
    }
    console.log("Teste PostgreSQL concluído. Todos os dados de teste foram revertidos.");
  } finally {
    await sequelize.close();
  }
}

main().catch((error: unknown) => {
  console.error("Teste PostgreSQL falhou:", (error as { name?: string }).name ?? "Error");
  process.exitCode = 1;
});
