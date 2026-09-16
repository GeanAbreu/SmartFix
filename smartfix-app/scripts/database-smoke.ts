import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

loadEnvConfig(process.cwd(), true);

async function main() {
  const { default: sequelize, assertDatabaseConfigured } = await import("../src/config/database");
  const { Client, ClientAddress, ClientDevice, Partner, RepairOrderModel, Review } = await import("../src/models");
  const { readRepairOrders, saveRepairOrder } = await import("../src/services/repair-order.repository");
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
      const order: import("../src/types/workflow").RepairOrder = {
        id: randomUUID(), clientId: client.id, partnerId: partner.id, deviceId: device.id,
        device: "Apple iPhone 13", problem: "Não liga nem carrega", status: "pending",
        createdAt: new Date().toISOString(), quote: [], symptoms: [], checklist: [],
        diagnosis: "", history: [], review: null,
      };
      await saveRepairOrder(order, transaction);
      assert.equal((await RepairOrderModel.findByPk(order.id, { transaction }))?.estimated_budget, null);
      const rejectWrite = async (run: (savepoint: import("sequelize").Transaction) => Promise<unknown>, code: string) => {
        await assert.rejects(sequelize.transaction({ transaction }, run), (error: unknown) =>
          (error as { original?: { code?: string } }).original?.code === code);
      };
      await rejectWrite((savepoint) => Review.create({ repair_order_id: order.id, client_id: client.id,
        partner_id: partner.id, rating: 5, comment: "Cedo", review_date: "2026-09-16" }, { transaction: savepoint }), "23514");
      await rejectWrite((savepoint) => device.destroy({ transaction: savepoint }), "23503");
      const other = await Client.create({ nome: "Outro cliente", email: `other-${suffix}@example.invalid`,
        cpf: randomUUID().replaceAll("-", "").slice(0, 11), senha: "test-only" }, { transaction });
      await rejectWrite((savepoint) => saveRepairOrder({ ...order, id: randomUUID(), clientId: other.id }, savepoint), "23503");
      order.status = "completed";
      order.quote = [{ name: "Reparo", quantity: 2, unitPriceCents: 19990 }];
      await saveRepairOrder(order, transaction);
      assert.equal((await RepairOrderModel.findByPk(order.id, { transaction }))?.estimated_budget, "399.80");
      await rejectWrite((savepoint) => Review.create({ repair_order_id: order.id, client_id: other.id,
        partner_id: partner.id, rating: 5, comment: "Não pertence", review_date: "2026-09-16" }, { transaction: savepoint }), "23503");
      order.review = { rating: 5, comment: "Resolvido" };
      await saveRepairOrder(order, transaction);
      assert.equal(await Review.count({ where: { repair_order_id: order.id }, transaction }), 1);
      await saveRepairOrder(order, transaction);
      assert.equal(await Review.count({ where: { repair_order_id: order.id }, transaction }), 1);
      const loaded = (await readRepairOrders(transaction)).find((record) => record.id === order.id);
      assert.deepEqual(loaded?.data.review, order.review);
      await rejectWrite((savepoint) => Review.create({ repair_order_id: order.id, client_id: client.id,
        partner_id: partner.id, rating: 4, comment: "Duplicada", review_date: "2026-09-16" }, { transaction: savepoint }), "23505");
      await rejectWrite((savepoint) => sequelize.query("UPDATE reviews SET rating=6 WHERE repair_order_id=$1",
        { bind: [order.id], transaction: savepoint }), "23514");
      await RepairOrderModel.destroy({ where: { id: order.id }, transaction });
      assert.equal(await Review.count({ where: { repair_order_id: order.id }, transaction }), 0);
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
      console.log("DER: CRUD, endereços, ordens, orçamento, avaliação única, propriedade, FKs e cascatas: OK.");
    } finally {
      // No fixture or deletion survives this verification, including on failure.
      await transaction.rollback();
    }
    for (const role of ["anon", "authenticated"]) {
      const transaction = await sequelize.transaction();
      try {
        await sequelize.query(`SET LOCAL ROLE ${role}`, { transaction });
        const [permissions] = await sequelize.query(`SELECT bool_and(NOT has_table_privilege(current_user, c.oid, 'SELECT')) AS denied
          FROM pg_class c WHERE c.relnamespace='public'::regnamespace
          AND c.relname IN ('clients','partner','devices','client_addresses','repair_orders','reviews','workflow_records')`, { transaction });
        assert.equal((permissions[0] as { denied: boolean }).denied, true);
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
