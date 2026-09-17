import { loadEnvConfig } from "@next/env";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { QueryTypes, Transaction, type Model, type ModelStatic } from "sequelize";

loadEnvConfig(process.cwd(), true);

async function main() {
  const { default: sequelize, assertDatabaseConfigured } = await import("../src/config/database");
  const { Client, ClientAddress, ClientDevice, Partner, RepairOrderModel, Review } = await import("../src/models");
  const { Workflow } = await import("../src/models/Workflow");
  try {
    assertDatabaseConfigured();
    if (process.argv[2] === "migrate") {
      await sequelize.query(`CREATE TABLE IF NOT EXISTS public.smartfix_migrations (
        name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
        ALTER TABLE public.smartfix_migrations ENABLE ROW LEVEL SECURITY;
        REVOKE ALL ON public.smartfix_migrations FROM PUBLIC;
        DO $$ DECLARE r text; BEGIN FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN
            EXECUTE format('REVOKE ALL ON public.smartfix_migrations FROM %I',r);
          END IF; END LOOP; END $$;`);
      const applied = await sequelize.query<{ name: string }>("SELECT name FROM public.smartfix_migrations", { type: QueryTypes.SELECT });
      const pending = ["20260909_contributions.sql", "20260916_database_persistence.sql", "20260917_normalize_addresses.sql", "20260918_der.sql", "20260919_device_issue.sql"]
        .filter((name) => !applied.some((entry) => entry.name === name));
      if (pending.length) {
      const backup: Record<string, unknown> = {};
      // Snapshot under one repeatable-read transaction, before any schema changes.
      await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ }, async (transaction) => {
        for (const table of ["clients", "partner", "client_addresses", "client_devices", "devices", "workflow_records", "repair_orders", "reviews"]) {
          const [exists] = await sequelize.query<{ present: string | null }>("SELECT to_regclass($1)::text AS present",
            { bind: [`public.${table}`], type: QueryTypes.SELECT, transaction });
          if (!exists.present) continue;
          const [rows] = await sequelize.query(`SELECT * FROM public.${table}`, { transaction });
          backup[table] = rows;
        }
      });
      const backupDirectory = path.resolve(".smartfix-data/backups");
      await mkdir(backupDirectory, { recursive: true });
      const backupFile = path.join(backupDirectory, `before-migration-${Date.now()}.json`);
      await writeFile(backupFile, JSON.stringify(backup), { mode: 0o600, flag: "wx" });
      console.log("Backup salvo em .smartfix-data/backups (não versionado).");
      for (const name of pending) {
        const sql = await readFile(path.resolve("../Database/migrations", name), "utf8");
        // Record each migration in the same transaction as its schema changes.
        const body = sql.replace(/^BEGIN;\s*$/m, "").replace(/^COMMIT;\s*$/m, "");
        await sequelize.transaction(async (transaction) => {
          await sequelize.query(body, { transaction });
          await sequelize.query("INSERT INTO public.smartfix_migrations(name) VALUES ($1)", { bind: [name], transaction });
        });
        console.log(`Migration aplicada: ${name}`);
      }
      } else console.log("Banco já está atualizado; nenhuma migration pendente.");
    }
    // Exercise the real ORM mappings without returning personal information.
    const models: ModelStatic<Model>[] = [Client, ClientAddress, ClientDevice, Partner, RepairOrderModel, Review, Workflow];
    for (const model of models) {
      await model.findAll({ limit: 0 });
      console.log(`Esquema compatível: ${model.tableName}`);
    }
    const [rows] = await sequelize.query(`
      SELECT c.relname AS tabela, c.relrowsecurity AS rls,
        (r.rolsuper OR r.rolbypassrls OR
          (pg_has_role(current_user, c.relowner, 'USAGE') AND NOT c.relforcerowsecurity)) AS acesso_servidor
      FROM pg_class c JOIN pg_roles r ON r.rolname = current_user
      WHERE c.relnamespace = 'public'::regnamespace
        AND c.relname IN ('clients','client_addresses','devices','partner','repair_orders','reviews','workflow_records')
      ORDER BY c.relname
    `);
    console.table(rows);
    if (rows.length !== 7 || rows.some((row) => {
      const value = row as { rls: boolean; acesso_servidor: boolean };
      return !value.rls || !value.acesso_servidor;
    })) throw new Error("Confira RLS e a função PostgreSQL usada pelo servidor conforme README.");
  } finally {
    await sequelize.close();
  }
}

main().catch((error: unknown) => {
  // Do not print connection objects, URLs or SQL bind parameters (credentials/PII).
  const code = (error as { original?: { code?: string }; code?: string }).original?.code
    ?? (error as { code?: string }).code;
  console.error(`Verificação falhou${code ? ` (${code})` : ""}. Confira DATABASE_URL, SSL e migrations no README.`);
  process.exitCode = 1;
});
