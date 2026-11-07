import assert from "node:assert/strict";
import test from "node:test";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

test("todas as migrations seguem o padrão descoberto automaticamente", async () => {
  const directory = path.resolve("../database/migrations");
  const files = (await readdir(directory)).filter((name) => name.endsWith(".sql"));
  assert.ok(files.length > 0);
  for (const file of files) assert.match(file, /^\d{8}_[a-z0-9_]+\.sql$/i);
  assert.deepEqual([...files].sort((left, right) => left.localeCompare(right)), files);

  const runner = await readFile(path.resolve("scripts/database.ts"), "utf8");
  assert.match(runner, /readdir\(migrationDirectory\)/);
  assert.doesNotMatch(runner, /20261104_terms_audit\.sql/);
  assert.match(runner, /SELECT to_regclass\('public\.smartfix_migrations'\)::text AS present/);
  assert.match(runner, /!shouldMigrate && pending\.length/);
  assert.ok(
    runner.indexOf("Migrations pendentes") < runner.indexOf("const models"),
    "o check deve interromper antes de consultar models incompatíveis",
  );
});

test("migrations opcionais do Supabase não exigem papéis no PostgreSQL local", async () => {
  const migration = await readFile(
    path.resolve("../database/migrations/20261105_admin_console.sql"),
    "utf8",
  );

  assert.doesNotMatch(migration, /FROM\s+anon\s*,\s*authenticated/i);
  assert.match(migration, /SELECT\s+1\s+FROM\s+pg_roles\s+WHERE\s+rolname\s*=\s*browser_role/i);
  assert.match(migration, /format\([\s\S]*FROM %I[\s\S]*browser_role/i);
  assert.match(migration, /repair_orders_status_check[\s\S]*'rejected'/i);
});
