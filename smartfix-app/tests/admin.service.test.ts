import assert from "node:assert/strict";
import test from "node:test";
import sequelize from "../src/config/database";
import {
  adminUsers,
  permissionsForAdminRole,
  requireAdministrator,
} from "../src/services/admin.service";

test("papéis administrativos aplicam permissões canônicas no servidor", async (t) => {
  const previous = { ...process.env };
  process.env.DATABASE_URL = "postgres://test:test@localhost/test";
  process.env.ADMIN_USER_IDS = "";

  t.mock.method(sequelize, "query", async () => [{ role: "support" }]);
  try {
    const access = await requireAdministrator({
      sub: "42",
      role: "client",
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    assert.deepEqual(access.permissions, permissionsForAdminRole("support"));
    assert.ok(access.permissions.includes("support"));
    assert.ok(!access.permissions.includes("finance"));
  } finally {
    process.env = previous;
  }
});

test("paginação administrativa normaliza números adversariais", async (t) => {
  let call = 0;
  t.mock.method(sequelize, "query", async (sql: string, options?: { replacements?: Record<string, unknown> }) => {
    call += 1;
    assert.equal(options?.replacements?.limit, 20);
    assert.equal(options?.replacements?.offset, 0);
    if (call === 1) {
      assert.doesNotMatch(sql, /AND is_active = :active/);
      return [{ id: "1", name: "Cliente" }];
    }
    return [{ total: "25" }];
  });

  const result = await adminUsers(new URLSearchParams({
    page: "Infinity",
    limit: "3.5",
    status: "valor-invalido",
  }));

  assert.equal(result.page, 1);
  assert.equal(result.limit, 20);
  assert.equal(result.hasMore, true);
  assert.equal(result.items.length, 1);
  assert.equal(call, 2);
});
