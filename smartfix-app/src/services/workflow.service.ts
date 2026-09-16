import "server-only";
import sequelize, { assertDatabaseConfigured } from "@/src/config/database";
import { Workflow } from "@/src/models/Workflow";
import { RepairOrderModel } from "@/src/models/RepairOrder";
import { readRepairOrders, saveRepairOrder } from "./repair-order.repository";
import { localWorkflow, usesLocalAuthStore } from "./local-auth.service";
import type { RepairOrder, WorkflowRecord } from "@/src/types/workflow";
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
    const records = [
      ...rows.map((row) => row.get({ plain: true }) as WorkflowRecord),
      ...await readRepairOrders(transaction),
    ];
    const before = new Map(
      records.map((record) => [`${record.kind}:${record.id}`, { record, json: JSON.stringify(record) }]),
    );
    const result = await operation(records, transaction);
    if (write) {
      for (const record of records) {
        const key = `${record.kind}:${record.id}`;
        if (before.get(key)?.json !== JSON.stringify(record)) {
          if (record.kind === "order")
            await saveRepairOrder(record.data as unknown as RepairOrder, transaction);
          else await Workflow.upsert(record, { transaction });
        }
        before.delete(key);
      }
      for (const { record } of before.values()) {
        if (record.kind === "order")
          await RepairOrderModel.destroy({ where: { id: record.id }, transaction });
        else await Workflow.destroy({ where: { id: record.id }, transaction });
      }
    }
    return result;
  });
}
