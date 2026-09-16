import { loadEnvConfig } from "@next/env";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

loadEnvConfig(process.cwd(), true);

const userSchema = z.object({
  id: z.uuid(), role: z.enum(["client", "partner"]), name: z.string(), email: z.email(),
  passwordHash: z.string().min(1), document: z.string(), phone: z.string(),
  birthDate: z.string().nullable(), companyName: z.string().nullable(),
  address: z.string().optional(), city: z.string().optional(), state: z.string().optional(), zipCode: z.string().optional(),
  isVerified: z.boolean(), createdAt: z.iso.datetime(),
});
const addressSchema = z.object({
  id: z.uuid(), clientId: z.uuid().nullable(), partnerId: z.uuid().nullable().optional(), apelido: z.string(), cep: z.string(),
  logradouro: z.string(), numero: z.string(), complemento: z.string(),
  bairro: z.string(), cidade: z.string(), estado: z.string(), principal: z.boolean(),
});
const deviceSchema = z.object({
  id: z.uuid(), clientId: z.uuid(), tipo: z.string(), marca: z.string(), modelo: z.string(),
  fotoUrl: z.string(), apelido: z.string().default(""), numeroSerie: z.string().default(""),
});
const storeSchema = z.object({
  version: z.literal(1), users: z.array(userSchema),
  addresses: z.array(addressSchema).default([]), devices: z.array(deviceSchema).default([]),
  workflow: z.array(z.object({
    id: z.uuid(), kind: z.enum(["order", "notification", "reset", "google", "service"]),
    ownerId: z.uuid(), data: z.record(z.string(), z.unknown()),
  })).default([]),
});

async function main() {
  const filename = path.resolve(process.argv[2] ?? ".smartfix-data/auth.json");
  const store = storeSchema.parse(JSON.parse(await readFile(filename, "utf8")));
  const { default: sequelize, assertDatabaseConfigured } = await import("../src/config/database");
  const { Client, ClientAddress, ClientDevice, Partner } = await import("../src/models");
  const { Workflow } = await import("../src/models/Workflow");
  const { hashPassword } = await import("../src/services/password.service");
  const counts = { clients: 0, partners: 0, addresses: 0, devices: 0, workflow: 0 };
  try {
    assertDatabaseConfigured();
    await sequelize.transaction(async (transaction) => {
      for (const user of store.users) {
        // Existing bcrypt hashes remain valid; only plaintext legacy passwords are hashed.
        const password = /^\$2[aby]\$\d{2}\$/.test(user.passwordHash)
          ? user.passwordHash : await hashPassword(user.passwordHash);
        if (user.role === "client") {
          const existing = await Client.findByPk(user.id, { transaction });
          if (existing) {
            if (existing.email !== user.email || existing.cpf !== user.document) throw new Error("LOCAL_ID_CONFLICT");
            continue;
          }
          await Client.create({ id: user.id, nome: user.name, email: user.email, senha: password,
            cpf: user.document, telefone: user.phone, data_nascimento: user.birthDate,
            created_at: new Date(user.createdAt) }, { transaction });
          counts.clients++;
        } else {
          const existing = await Partner.findByPk(user.id, { transaction });
          if (existing) {
            if (existing.email !== user.email || existing.cnpj !== user.document) throw new Error("LOCAL_ID_CONFLICT");
            continue;
          }
          await Partner.create({ id: user.id, full_name: user.name, email: user.email,
            password_hash: password, cnpj: user.document, phone: user.phone,
            company_name: user.companyName, is_verified: user.isVerified,
            created_at: new Date(user.createdAt) }, { transaction });
          counts.partners++;
        }
      }
      for (const address of store.addresses) {
        const existing = await ClientAddress.findByPk(address.id, { transaction });
        if (existing) {
          if (existing.client_id !== address.clientId || existing.partner_id !== (address.partnerId ?? null)) throw new Error("LOCAL_ID_CONFLICT");
          continue;
        }
        const { clientId, partnerId, ...values } = address;
        await ClientAddress.create({ ...values, client_id: clientId, partner_id: partnerId ?? null }, { transaction });
        counts.addresses++;
      }
      // Legacy offline partner profiles used one concatenated street field.
      // Preserve it verbatim; do not guess a house number or neighborhood.
      for (const user of store.users.filter((user) => user.role === "partner")) {
        if (!user.address && !user.city && !user.state && !user.zipCode) continue;
        if (await ClientAddress.count({ where: { partner_id: user.id }, transaction })) continue;
        await ClientAddress.create({ partner_id: user.id, apelido: "Principal",
          cep: user.zipCode ?? "", logradouro: user.address ?? "", numero: "", complemento: "",
          bairro: "", cidade: user.city ?? "", estado: user.state ?? "", principal: true }, { transaction });
        counts.addresses++;
      }
      for (const device of store.devices) {
        const existing = await ClientDevice.findByPk(device.id, { transaction });
        if (existing) {
          if (existing.client_id !== device.clientId) throw new Error("LOCAL_ID_CONFLICT");
          continue;
        }
        const { clientId, fotoUrl, numeroSerie, ...values } = device;
        await ClientDevice.create({ ...values, client_id: clientId, foto_url: fotoUrl, numero_serie: numeroSerie }, { transaction });
        counts.devices++;
      }
      for (const record of store.workflow) {
        const existing = await Workflow.findByPk(record.id, { transaction });
        if (existing) {
          if (existing.ownerId !== record.ownerId || existing.kind !== record.kind) throw new Error("LOCAL_ID_CONFLICT");
          continue;
        }
        await Workflow.create(record, { transaction });
        counts.workflow++;
      }
    });
    console.log("Importação concluída. IDs e vínculos preservados; arquivo local mantido.");
    console.table(counts);
  } finally {
    await sequelize.close();
  }
}

main().catch(() => {
  console.error("Importação não concluída; a transação foi revertida. Confira conexão, migrations, formato e conflitos de e-mail/CPF/CNPJ/ID. O arquivo local permanece intacto.");
  process.exitCode = 1;
});
