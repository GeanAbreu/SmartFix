import "server-only";
import sequelize, { assertDatabaseConfigured } from "@/src/config/database";
import { Workflow } from "@/src/models/Workflow";
import { localWorkflow, usesLocalAuthStore } from "./local-auth.service";
import type { WorkflowRecord } from "@/src/types/workflow";
import type { Transaction } from "sequelize";

// All workflow mutations share the same transaction lock. Local development uses
// the existing auth store queue; PostgreSQL uses a transaction advisory lock.
export async function withWorkflow<T>(
  operation: (
    records: WorkflowRecord[],
    transaction?: Transaction,
  ) => Promise<T> | T,
  write = false,
): Promise<T> {
  if (usesLocalAuthStore()) return localWorkflow(operation, write);
  assertDatabaseConfigured();
  return sequelize.transaction(async (transaction) => {
    if (write)
      await sequelize.query("SELECT pg_advisory_xact_lock(73920418)", {
        transaction,
      });
    const rows = await Workflow.findAll({ transaction });
    const records = rows.map(
      (row) => row.get({ plain: true }) as WorkflowRecord,
    );
    const before = new Map(
      records.map((record) => [record.id, JSON.stringify(record)]),
    );
    const result = await operation(records, transaction);
    if (write) {
      for (const record of records) {
        if (before.get(record.id) !== JSON.stringify(record))
          await Workflow.upsert(record, { transaction });
        before.delete(record.id);
      }
      for (const id of before.keys())
        await Workflow.destroy({ where: { id }, transaction });
    }
    return result;
  });
}
