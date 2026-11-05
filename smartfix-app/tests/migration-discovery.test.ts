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
});
